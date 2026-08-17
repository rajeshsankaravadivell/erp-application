// Local, slim master-data shapes — intentionally duplicated rather than
// imported from frontend/src/types/master-data.ts (no npm/pnpm workspace
// exists in this repo, and these are deliberately slimmer: no Timestamp, no
// audit fields, keeping this whole module free of any firebase-admin
// dependency so it stays trivially unit-testable).
// Keep in sync with frontend/src/types/master-data.ts.

export type WireGaugeSystem = "SWG" | "AWG";
export type ConductorMaterial = "Copper" | "Aluminum";

export interface CalcConstants {
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
  coreStackingFactor: number;
}

export interface LossCurvePoint {
  bmTesla: number;
  lossWPerKg: number;
}

export interface CalcCoreMaterial {
  lossCurve: LossCurvePoint[];
}

export interface CalcWireSize {
  id: string;
  gauge: string;
  bareAreaMm2: number;
}

// --- request -----------------------------------------------------------

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

// --- response ------------------------------------------------------------

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

export interface MasterData {
  constants: CalcConstants;
  coreMaterial: CalcCoreMaterial;
  wireSizeCandidates: CalcWireSize[];
}
