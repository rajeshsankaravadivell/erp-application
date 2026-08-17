import { describe, expect, it } from "vitest";

import { calculateDynamicBom } from "../calculate";
import { NoEligibleWireSizeError } from "../errors";
import type { GenerateDynamicBomRequest, MasterData } from "../types";

const request: GenerateDynamicBomRequest = {
  electricalInputs: {
    kVA: 100,
    phases: 3,
    primaryVoltageV: 11000,
    secondaryVoltageV: 433,
    frequencyHz: 50,
    regulationPercent: 4.5,
    voltsPerTurnK: 0.45,
    gaugeSystem: "SWG",
    lvConductorMaterial: "Aluminum",
    hvConductorMaterial: "Copper",
    coreMaterialId: "cm1",
  },
  geometricInputs: {
    coreDiameterMm: 180,
    coreCircuitLengthMm: 900,
    lvRadialBuildMm: 20,
    hvRadialBuildMm: 30,
    lvToCoreClearanceMm: 5,
    hvToLvClearanceMm: 8,
    tankVolumeLiters: 250,
    scrapTolerancePercent: 5,
  },
  commercialInputs: {
    purchasePrice: 10000,
    noLoadLossCapitalizationRate: 8,
    loadLossCapitalizationRate: 2,
  },
};

const masterData: MasterData = {
  constants: {
    bmTesla: 1.6,
    currentDensity: { copperAPerMm2: 2.3, aluminumAPerMm2: 1.6 },
    densityKgPerM3: { copper: 8960, aluminum: 2700, crgo: 7650, oil: 880 },
    coreStackingFactor: 0.95,
  },
  coreMaterial: {
    lossCurve: [
      { bmTesla: 1.0, lossWPerKg: 0.8 },
      { bmTesla: 1.5, lossWPerKg: 1.5 },
      { bmTesla: 1.7, lossWPerKg: 2.0 },
    ],
  },
  wireSizeCandidates: [
    { id: "w18", gauge: "18", bareAreaMm2: 1.0 },
    { id: "w17", gauge: "17", bareAreaMm2: 1.5 },
    { id: "w16", gauge: "16", bareAreaMm2: 2.076 },
    { id: "w15", gauge: "15", bareAreaMm2: 2.627 },
    { id: "w10", gauge: "10", bareAreaMm2: 84.0 },
    { id: "w9", gauge: "9", bareAreaMm2: 90.0 },
  ],
};

describe("calculateDynamicBom — worked example (100kVA, 11000/433V, 3-phase)", () => {
  const result = calculateDynamicBom(request, masterData);

  it("computes volts per turn", () => {
    expect(result.voltsPerTurn).toBeCloseTo(4.5, 6);
  });

  it("computes net iron core area", () => {
    expect(result.core.netIronAreaMm2).toBeCloseTo(12668.919, 2);
  });

  it("computes HV and LV turns", () => {
    expect(result.hv.turns).toBe(2444);
    expect(result.lv.turns).toBe(101);
  });

  it("computes rated currents", () => {
    expect(result.hv.ratedCurrentA).toBeCloseTo(5.24864, 4);
    expect(result.lv.ratedCurrentA).toBeCloseTo(133.33724, 3);
  });

  it("snaps conductor areas up to the correct wire size, never below requirement", () => {
    expect(result.hv.theoreticalAreaMm2).toBeCloseTo(2.28202, 4);
    expect(result.hv.selectedWireSize.gauge).toBe("15");
    expect(result.hv.selectedWireSize.bareAreaMm2).toBeGreaterThanOrEqual(result.hv.theoreticalAreaMm2);

    expect(result.lv.theoreticalAreaMm2).toBeCloseTo(83.33578, 3);
    expect(result.lv.selectedWireSize.gauge).toBe("10");
    expect(result.lv.selectedWireSize.bareAreaMm2).toBeGreaterThanOrEqual(result.lv.theoreticalAreaMm2);
  });

  it("computes MLT for both windings from the winding buildup geometry", () => {
    expect(result.lv.mltMm).toBeCloseTo(659.7345, 3);
    expect(result.hv.mltMm).toBeCloseTo(867.0796, 3);
  });

  it("computes conductor weights including scrap tolerance", () => {
    expect(result.lv.conductorWeightKg).toBeCloseTo(15.868, 2);
    expect(result.hv.conductorWeightKg).toBeCloseTo(52.374, 1);
  });

  it("computes core weight from net iron area, not gross", () => {
    expect(result.core.coreWeightKg).toBeCloseTo(87.226, 2);
  });

  it("interpolates no-load loss from the core material's loss curve", () => {
    expect(result.core.noLoadLossWatts).toBeCloseTo(152.645, 1);
  });

  it("computes load losses for both windings from resistivity and I²R", () => {
    expect(result.lv.loadLossWatts).toBeCloseTo(397.707, 1);
    expect(result.hv.loadLossWatts).toBeCloseTo(373.338, 1);
    expect(result.tec.loadLossWatts).toBeCloseTo(771.046, 1);
  });

  it("computes oil displacement (pre-scrap volumes) and oil weight", () => {
    expect(result.oil.activePartDisplacementLiters).toBeCloseTo(22.566, 2);
    expect(result.oil.oilWeightKg).toBeCloseTo(200.142, 1);
  });

  it("computes total ownership cost", () => {
    expect(result.tec.totalOwnershipCost).toBeCloseTo(12763.25, 0);
  });

  it("produces no warnings for a well-formed design", () => {
    expect(result.warnings).toEqual([]);
  });
});

describe("calculateDynamicBom — edge cases", () => {
  it("throws NoEligibleWireSizeError when no wire size is large enough for a winding", () => {
    const tinyWireSizes: MasterData = {
      ...masterData,
      wireSizeCandidates: [{ id: "w18", gauge: "18", bareAreaMm2: 1.0 }],
    };
    expect(() => calculateDynamicBom(request, tinyWireSizes)).toThrow(NoEligibleWireSizeError);
  });

  it("warns when operating Bm is outside the core material's loss curve range", () => {
    const outOfRangeMasterData: MasterData = {
      ...masterData,
      constants: { ...masterData.constants, bmTesla: 2.5 },
    };
    const result = calculateDynamicBom(request, outOfRangeMasterData);
    expect(
      result.warnings.some((w) => w.includes("outside the selected core material's loss curve range")),
    ).toBe(true);
  });

  it("warns when the electrically-required core area exceeds the provided core diameter", () => {
    const tightGeometry: GenerateDynamicBomRequest = {
      ...request,
      geometricInputs: { ...request.geometricInputs, coreDiameterMm: 50 },
    };
    const result = calculateDynamicBom(tightGeometry, masterData);
    expect(result.warnings.some((w) => w.includes("exceeds the"))).toBe(true);
  });

  it("never selects a wire size smaller than the theoretical requirement (round up, not nearest)", () => {
    // ac_HV = 2.28202 sits between "16" (2.076, too small) and "15" (2.627) —
    // nearest-by-difference would pick "16" (closer numerically); round-up must pick "15".
    const result = calculateDynamicBom(request, masterData);
    expect(result.hv.selectedWireSize.gauge).toBe("15");
  });
});
