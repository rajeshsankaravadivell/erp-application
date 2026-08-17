import type { Timestamp } from "firebase-admin/firestore";

import type { WireGaugeSystem } from "./master-data";
import type { InventoryMaterial } from "./inventory";

// Local mirror of functions/src/bom/types.ts — duplicated rather than
// imported (no npm/pnpm workspace exists; functions/ is a separately
// deployed package). Keep in sync with functions/src/bom/types.ts and
// functions/src/bom/validation.ts.

export type ConductorMaterial = "Copper" | "Aluminum";

export interface ElectricalInputs {
  kVA: number;
  phases: 1 | 3;
  primaryVoltageV: number;
  secondaryVoltageV: number;
  frequencyHz: number;
  regulationPercent: number;
  voltsPerTurnK: number;
  gaugeSystem: WireGaugeSystem;
  lvConductorMaterial: ConductorMaterial;
  hvConductorMaterial: ConductorMaterial;
  /** Direct coreMaterials/{id} doc reference — a design choice, not a derived value. */
  coreMaterialId: string;
}

export interface GeometricInputs {
  coreDiameterMm: number;
  coreCircuitLengthMm: number;
  lvRadialBuildMm: number;
  hvRadialBuildMm: number;
  lvToCoreClearanceMm: number;
  hvToLvClearanceMm: number;
  tankVolumeLiters: number;
  scrapTolerancePercent: number;
}

export interface CommercialInputs {
  purchasePrice: number;
  noLoadLossCapitalizationRate: number;
  loadLossCapitalizationRate: number;
}

export interface GenerateDynamicBomRequest {
  electricalInputs: ElectricalInputs;
  geometricInputs: GeometricInputs;
  commercialInputs: CommercialInputs;
}

export interface WindingResult {
  ratedCurrentA: number;
  turns: number;
  theoreticalAreaMm2: number;
  selectedWireSize: { id: string; gauge: string; bareAreaMm2: number };
  meanDiameterMm: number;
  mltMm: number;
  conductorLengthM: number;
  conductorWeightKg: number;
  resistanceOhm: number;
  loadLossWatts: number;
}

export interface BomResult {
  voltsPerTurn: number;
  core: {
    netIronAreaMm2: number;
    grossCoreAreaMm2: number;
    coreWeightKg: number;
    noLoadLossWatts: number;
  };
  lv: WindingResult;
  hv: WindingResult;
  oil: {
    activePartDisplacementLiters: number;
    oilWeightKg: number;
  };
  tec: {
    noLoadLossWatts: number;
    loadLossWatts: number;
    capitalizedNoLoadLossCost: number;
    capitalizedLoadLossCost: number;
    totalOwnershipCost: number;
  };
  warnings: string[];
}

// "Pending Procurement" isn't in the spec's original 4-status list (§3.4) but is
// explicitly introduced by the Saga-pattern failure path (§4.C.4) — a genuine
// spec inconsistency, resolved by treating it as a real 5th status.
export type DesignStatus = "Draft" | "Pending Approval" | "Approved" | "Pending Procurement" | "Procured";

/** One material's actual Hard Reserve, set when a design is Approved. */
export interface ReservationLine {
  material: InventoryMaterial;
  reservedKg: number;
}

/** Per-winding cumulative issuance against an Approved design's Hard Reserve. */
export interface WindingIssuanceSummary {
  issuedKg: number;
}

/** One material's shortfall, set when a design is flagged Pending Procurement. */
export interface DesignShortfall {
  material: InventoryMaterial;
  requiredKg: number;
  availableKg: number;
  shortKg: number;
}

/** Firestore document in the `designs` collection — one per transformer design iteration. */
export interface DesignDoc {
  /** Required human-readable label (e.g. customer + job reference) — not named in the
   *  spec's data model, but a list view needs some identifier beyond kVA/status. */
  name: string;
  status: DesignStatus;
  electricalInputs: ElectricalInputs;
  geometricInputs: GeometricInputs;
  commercialInputs: CommercialInputs;
  /** Always present — a design is never persisted without a successfully generated BOM. */
  dynamicBOM: BomResult;
  /** Set by the Hard Reserve transaction when the design is Approved. */
  reservation?: ReservationLine[];
  /** Seeded on Approve, incremented as Store Manager issues material against each winding. */
  issuance?: { lv: WindingIssuanceSummary; hv: WindingIssuanceSummary };
  /** Set when flagged Pending Procurement; cleared on a successful retry approval. */
  shortfalls?: DesignShortfall[];
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}
