import type { Timestamp } from "firebase-admin/firestore";

/**
 * Firestore document at `masterData/constants` — a singleton doc holding the
 * global engineering constants used throughout the physics calculation
 * engine (introduced in a later phase).
 */
export interface ConstantsDoc {
  bmTesla: number;
  currentDensity: {
    copperAPerMm2: number;
    aluminumAPerMm2: number;
  };
  densityKgPerM3: {
    copper: number;
    aluminum: number;
    crgo: number;
    oil: number;
  };
  /** Lamination stacking factor as a fraction (e.g. 0.95 for CRGO). */
  coreStackingFactor: number;
  updatedAt: Timestamp;
  updatedBy: string;
}

export type WireGaugeSystem = "SWG" | "AWG";

/** Firestore document in the `wireSizes` collection — one row per gauge. */
export interface WireSizeDoc {
  system: WireGaugeSystem;
  gauge: string;
  bareDiameterMm: number;
  bareAreaMm2: number;
  insulatedDiameterMm: number;
  insulatedAreaMm2: number;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface LossCurvePoint {
  bmTesla: number;
  lossWPerKg: number;
}

/**
 * Firestore document in the `coreMaterials` collection — one row per
 * grade+thickness combination. `lossCurve` is stored sorted ascending by
 * `bmTesla` so later interpolation doesn't need to re-sort.
 */
export interface CoreMaterialDoc {
  grade: string;
  thicknessMm: number;
  lossCurve: LossCurvePoint[];
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export const CORE_MATERIAL_GRADE_SUGGESTIONS = ["M4", "M5", "23MOH"] as const;
