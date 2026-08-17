import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import { convertToKg } from "@/lib/inventory/dual-uom";
import type {
  InventoryDoc,
  InventoryBatchDoc,
  ScrapLedgerEntryDoc,
  IssuanceDoc,
  InventoryMaterial,
  Winding,
  IssuanceUom,
} from "@/types/inventory";
import type { DesignDoc, DesignShortfall, ReservationLine } from "@/types/design";

const inventory = () => getAdminDb().collection("inventory");
const designs = () => getAdminDb().collection("designs");

export class InsufficientStockError extends Error {
  constructor(public readonly shortfalls: DesignShortfall[]) {
    super("Insufficient stock to approve this design.");
    this.name = "InsufficientStockError";
  }
}

// --- reads -----------------------------------------------------------

export async function listInventory(): Promise<(InventoryDoc & { id: InventoryMaterial })[]> {
  const snap = await inventory().get();
  return snap.docs.map((doc) => ({ id: doc.id as InventoryMaterial, ...(doc.data() as InventoryDoc) }));
}

export async function getInventory(material: InventoryMaterial): Promise<InventoryDoc | null> {
  const snap = await inventory().doc(material).get();
  return snap.exists ? (snap.data() as InventoryDoc) : null;
}

export async function listBatches(material: InventoryMaterial): Promise<(InventoryBatchDoc & { id: string })[]> {
  const snap = await inventory().doc(material).collection("batches").orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as InventoryBatchDoc) }));
}

export async function listScrapLedger(
  material: InventoryMaterial,
  limit = 50,
): Promise<(ScrapLedgerEntryDoc & { id: string })[]> {
  const snap = await inventory()
    .doc(material)
    .collection("scrapLedger")
    .orderBy("recordedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ScrapLedgerEntryDoc) }));
}

export async function listIssuances(designId: string): Promise<(IssuanceDoc & { id: string })[]> {
  const snap = await designs().doc(designId).collection("issuances").orderBy("issuedAt", "desc").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as IssuanceDoc) }));
}

// --- pure calculation, exported for unit testing ---------------------

export function computeReservationRequirements(
  design: Pick<DesignDoc, "electricalInputs" | "dynamicBOM">,
): { material: InventoryMaterial; requiredKg: number }[] {
  const totals = new Map<InventoryMaterial, number>();
  const add = (material: InventoryMaterial, kg: number) => {
    totals.set(material, (totals.get(material) ?? 0) + kg);
  };

  add(design.electricalInputs.lvConductorMaterial, design.dynamicBOM.lv.conductorWeightKg);
  add(design.electricalInputs.hvConductorMaterial, design.dynamicBOM.hv.conductorWeightKg);
  add("CRGO", design.dynamicBOM.core.coreWeightKg);
  add("Oil", design.dynamicBOM.oil.oilWeightKg);

  return Array.from(totals.entries()).map(([material, requiredKg]) => ({ material, requiredKg }));
}

// --- receiving -----------------------------------------------------------

export async function receiveStock(
  material: InventoryMaterial,
  data: { heatNumber: string; receivedKg: number; receivedDate: Date },
  uid: string,
): Promise<string> {
  const materialRef = inventory().doc(material);
  const batchRef = materialRef.collection("batches").doc();

  const batch = getAdminDb().batch();
  batch.set(
    materialRef,
    {
      availableKg: FieldValue.increment(data.receivedKg),
      // Increment reservedKg by 0 too, so both counters exist together from
      // the first write instead of reservedKg staying undefined until a
      // design first reserves against this material.
      reservedKg: FieldValue.increment(0),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true },
  );
  batch.set(batchRef, {
    heatNumber: data.heatNumber,
    receivedKg: data.receivedKg,
    receivedDate: Timestamp.fromDate(data.receivedDate),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  await batch.commit();
  return batchRef.id;
}

// --- scrap -----------------------------------------------------------------

export async function logScrap(
  material: InventoryMaterial,
  data: { scrapKg: number; reason: string; reference: string | null },
  uid: string,
): Promise<string> {
  const materialRef = inventory().doc(material);
  const scrapRef = materialRef.collection("scrapLedger").doc();

  await getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(materialRef);
    const availableKg = snap.exists ? (snap.data() as InventoryDoc).availableKg : 0;
    if (availableKg < data.scrapKg) {
      throw new Error(`Cannot log ${data.scrapKg}kg of scrap — only ${availableKg}kg of ${material} is available.`);
    }

    tx.set(
      materialRef,
      {
        availableKg: FieldValue.increment(-data.scrapKg),
        reservedKg: FieldValue.increment(0),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    );
    tx.set(scrapRef, {
      scrapKg: data.scrapKg,
      reason: data.reason,
      reference: data.reference,
      recordedAt: FieldValue.serverTimestamp(),
      recordedBy: uid,
    });
  });

  return scrapRef.id;
}

// --- the Hard Reserve (Saga pattern) --------------------------------------

export async function reserveInventoryForDesign(designId: string, uid: string): Promise<ReservationLine[]> {
  const designRef = designs().doc(designId);

  return getAdminDb().runTransaction(async (tx) => {
    // All reads before any writes — Firestore transaction requirement.
    const designSnap = await tx.get(designRef);
    if (!designSnap.exists) {
      throw new Error("Design not found.");
    }
    const design = designSnap.data() as DesignDoc;
    if (design.status !== "Pending Approval" && design.status !== "Pending Procurement") {
      throw new Error(
        `Only Pending Approval or Pending Procurement designs can be approved (current status: ${design.status}).`,
      );
    }

    const requirements = computeReservationRequirements(design);
    const materialRefs = requirements.map((r) => inventory().doc(r.material));
    const materialSnaps = await Promise.all(materialRefs.map((ref) => tx.get(ref)));

    const shortfalls: DesignShortfall[] = [];
    requirements.forEach((req, i) => {
      const snap = materialSnaps[i];
      const availableKg = snap.exists ? (snap.data() as InventoryDoc).availableKg : 0;
      if (availableKg < req.requiredKg) {
        shortfalls.push({
          material: req.material,
          requiredKg: req.requiredKg,
          availableKg,
          shortKg: req.requiredKg - availableKg,
        });
      }
    });

    if (shortfalls.length > 0) {
      // Throwing discards every staged write in this callback — Firestore's
      // idiomatic abort/rollback. This is a deliberate business-logic throw,
      // not a contention signal, so the SDK does not retry the callback.
      throw new InsufficientStockError(shortfalls);
    }

    requirements.forEach((req, i) => {
      tx.update(materialRefs[i], {
        availableKg: FieldValue.increment(-req.requiredKg),
        reservedKg: FieldValue.increment(req.requiredKg),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      });
    });

    const reservation: ReservationLine[] = requirements.map((r) => ({
      material: r.material,
      reservedKg: r.requiredKg,
    }));

    tx.update(designRef, {
      status: "Approved",
      reservation,
      issuance: { lv: { issuedKg: 0 }, hv: { issuedKg: 0 } },
      shortfalls: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    return reservation;
  });
}

export async function markDesignPendingProcurement(
  designId: string,
  shortfalls: DesignShortfall[],
  uid: string,
): Promise<void> {
  await designs()
    .doc(designId)
    .update({
      status: "Pending Procurement",
      shortfalls,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
}

// --- Dual UOM issuance -----------------------------------------------------

const EPSILON_KG = 1e-6;

export async function issueMaterialForDesign(
  designId: string,
  winding: Winding,
  uom: IssuanceUom,
  inputValue: number,
  uid: string,
): Promise<{ computedKg: number }> {
  const designRef = designs().doc(designId);
  const constantsRef = getAdminDb().collection("masterData").doc("constants");
  const issuanceRef = designRef.collection("issuances").doc();

  return getAdminDb().runTransaction(async (tx) => {
    const [designSnap, constantsSnap] = await Promise.all([tx.get(designRef), tx.get(constantsRef)]);

    if (!designSnap.exists) throw new Error("Design not found.");
    const design = designSnap.data() as DesignDoc;
    if (design.status !== "Approved") {
      throw new Error(`Can only issue material against an Approved design (current status: ${design.status}).`);
    }
    if (!constantsSnap.exists) throw new Error("masterData/constants has not been configured.");
    const constants = constantsSnap.data() as {
      densityKgPerM3: { copper: number; aluminum: number; crgo: number; oil: number };
    };

    const material =
      winding === "lv" ? design.electricalInputs.lvConductorMaterial : design.electricalInputs.hvConductorMaterial;
    const materialRef = inventory().doc(material);
    const materialSnap = await tx.get(materialRef);
    const reservedKg = materialSnap.exists ? (materialSnap.data() as InventoryDoc).reservedKg : 0;

    const windingResult = design.dynamicBOM[winding];
    const densityKgPerM3 = material === "Copper" ? constants.densityKgPerM3.copper : constants.densityKgPerM3.aluminum;

    const computedKg = convertToKg({
      uom,
      inputValue,
      bareAreaMm2: windingResult.selectedWireSize.bareAreaMm2,
      mltMm: windingResult.mltMm,
      densityKgPerM3,
    });

    const alreadyIssuedKg = design.issuance?.[winding]?.issuedKg ?? 0;
    const remainingForWindingKg = windingResult.conductorWeightKg - alreadyIssuedKg;
    if (computedKg > remainingForWindingKg + EPSILON_KG) {
      throw new Error(
        `Issuing ${computedKg.toFixed(3)}kg would exceed the ${winding.toUpperCase()} winding's remaining ` +
          `budget (${remainingForWindingKg.toFixed(3)}kg left of ${windingResult.conductorWeightKg.toFixed(3)}kg).`,
      );
    }
    if (computedKg > reservedKg + EPSILON_KG) {
      throw new Error(
        `Issuing ${computedKg.toFixed(3)}kg would exceed ${material}'s reserved stock (${reservedKg.toFixed(3)}kg).`,
      );
    }

    tx.update(materialRef, {
      reservedKg: FieldValue.increment(-computedKg),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
    tx.update(designRef, {
      [`issuance.${winding}.issuedKg`]: FieldValue.increment(computedKg),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
    tx.set(issuanceRef, {
      winding,
      material,
      uom,
      inputValue,
      computedKg,
      issuedAt: FieldValue.serverTimestamp(),
      issuedBy: uid,
    });

    return { computedKg };
  });
}
