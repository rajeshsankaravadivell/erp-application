import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import type { CoreMaterialDoc, WireSizeDoc, ConstantsDoc, LossCurvePoint } from "@/types/master-data";

const CONSTANTS_DOC_ID = "constants";

function sortLossCurve(points: LossCurvePoint[]): LossCurvePoint[] {
  return [...points].sort((a, b) => a.bmTesla - b.bmTesla);
}

// --- constants ---------------------------------------------------------

export async function getConstants(): Promise<ConstantsDoc | null> {
  const snap = await getAdminDb().collection("masterData").doc(CONSTANTS_DOC_ID).get();
  return snap.exists ? (snap.data() as ConstantsDoc) : null;
}

export async function setConstants(
  data: Omit<ConstantsDoc, "updatedAt" | "updatedBy">,
  uid: string,
): Promise<void> {
  await getAdminDb()
    .collection("masterData")
    .doc(CONSTANTS_DOC_ID)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp(), updatedBy: uid });
}

// --- wireSizes -----------------------------------------------------------

const wireSizes = () => getAdminDb().collection("wireSizes");

export async function listWireSizes(): Promise<(WireSizeDoc & { id: string })[]> {
  const snap = await wireSizes().get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as WireSizeDoc) }));
}

export async function getWireSize(id: string): Promise<WireSizeDoc | null> {
  const snap = await wireSizes().doc(id).get();
  return snap.exists ? (snap.data() as WireSizeDoc) : null;
}

export async function findWireSizeBySystemAndGauge(
  system: WireSizeDoc["system"],
  gauge: string,
): Promise<string | null> {
  const snap = await wireSizes().where("system", "==", system).where("gauge", "==", gauge).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

type WireSizeInputData = Omit<WireSizeDoc, "createdAt" | "createdBy" | "updatedAt" | "updatedBy">;

export async function createWireSize(data: WireSizeInputData, uid: string): Promise<string> {
  const ref = await wireSizes().add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  });
  return ref.id;
}

export async function updateWireSize(id: string, data: WireSizeInputData, uid: string): Promise<void> {
  await wireSizes()
    .doc(id)
    .update({ ...data, updatedAt: FieldValue.serverTimestamp(), updatedBy: uid });
}

export async function deleteWireSize(id: string): Promise<void> {
  await wireSizes().doc(id).delete();
}

// --- coreMaterials ---------------------------------------------------------

const coreMaterials = () => getAdminDb().collection("coreMaterials");

export async function listCoreMaterials(): Promise<(CoreMaterialDoc & { id: string })[]> {
  const snap = await coreMaterials().get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as CoreMaterialDoc) }));
}

export async function getCoreMaterial(id: string): Promise<CoreMaterialDoc | null> {
  const snap = await coreMaterials().doc(id).get();
  return snap.exists ? (snap.data() as CoreMaterialDoc) : null;
}

export async function findCoreMaterialByGradeAndThickness(
  grade: string,
  thicknessMm: number,
): Promise<string | null> {
  const snap = await coreMaterials()
    .where("grade", "==", grade)
    .where("thicknessMm", "==", thicknessMm)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

type CoreMaterialInputData = Omit<CoreMaterialDoc, "createdAt" | "createdBy" | "updatedAt" | "updatedBy">;

export async function createCoreMaterial(data: CoreMaterialInputData, uid: string): Promise<string> {
  const ref = await coreMaterials().add({
    ...data,
    lossCurve: sortLossCurve(data.lossCurve),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  });
  return ref.id;
}

export async function updateCoreMaterial(id: string, data: CoreMaterialInputData, uid: string): Promise<void> {
  await coreMaterials()
    .doc(id)
    .update({
      ...data,
      lossCurve: sortLossCurve(data.lossCurve),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
}

export async function deleteCoreMaterial(id: string): Promise<void> {
  await coreMaterials().doc(id).delete();
}
