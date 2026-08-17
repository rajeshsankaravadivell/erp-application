import type { Firestore, DocumentData } from "firebase-admin/firestore";

import type { CalcConstants, CalcCoreMaterial, CalcWireSize, WireGaugeSystem } from "./types";

function isCompleteConstants(data: DocumentData): data is CalcConstants {
  return (
    typeof data.bmTesla === "number" &&
    data.currentDensity != null &&
    typeof data.currentDensity.copperAPerMm2 === "number" &&
    typeof data.currentDensity.aluminumAPerMm2 === "number" &&
    data.densityKgPerM3 != null &&
    typeof data.densityKgPerM3.copper === "number" &&
    typeof data.densityKgPerM3.aluminum === "number" &&
    typeof data.densityKgPerM3.crgo === "number" &&
    typeof data.densityKgPerM3.oil === "number" &&
    typeof data.coreStackingFactor === "number"
  );
}

/**
 * Returns null if the constants doc doesn't exist yet, or is missing any
 * required field (including `coreStackingFactor`, an additive field that
 * older constants docs written before this phase won't have) — both cases
 * mean "masterData/constants has not been fully configured."
 */
export async function fetchConstants(db: Firestore): Promise<CalcConstants | null> {
  const snap = await db.collection("masterData").doc("constants").get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data || !isCompleteConstants(data)) return null;
  return {
    bmTesla: data.bmTesla,
    currentDensity: data.currentDensity,
    densityKgPerM3: data.densityKgPerM3,
    coreStackingFactor: data.coreStackingFactor,
  };
}

export async function fetchCoreMaterial(db: Firestore, id: string): Promise<CalcCoreMaterial | null> {
  const snap = await db.collection("coreMaterials").doc(id).get();
  if (!snap.exists) return null;
  const lossCurve = snap.data()?.lossCurve;
  if (!Array.isArray(lossCurve) || lossCurve.length === 0) return null;
  return { lossCurve: lossCurve as CalcCoreMaterial["lossCurve"] };
}

/**
 * Fetches every `wireSizes` row for a gauge system with a single equality
 * filter — no composite index needed (Firestore auto-indexes single-field
 * equality filters, same pattern as findWireSizeBySystemAndGauge in
 * frontend/src/lib/firestore/master-data.ts). The "smallest area >= required"
 * selection happens as a plain array filter+sort inside the pure calculation
 * function once this candidate list is passed in, rather than as a live
 * per-winding range query — see the Phase 3 plan for the full rationale.
 *
 * NOT implemented (documented here for future reference): a compound query
 * filtering both `system` (equality) AND `bareAreaMm2` (range, with a
 * matching orderBy) server-side WOULD require a composite index, e.g.:
 *   { collectionGroup: "wireSizes", fields: [
 *       { fieldPath: "system", order: "ASCENDING" },
 *       { fieldPath: "bareAreaMm2", order: "ASCENDING" } ] }
 */
export async function fetchWireSizesForSystem(db: Firestore, system: WireGaugeSystem): Promise<CalcWireSize[]> {
  const snap = await db.collection("wireSizes").where("system", "==", system).get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, gauge: String(data.gauge), bareAreaMm2: Number(data.bareAreaMm2) };
  });
}
