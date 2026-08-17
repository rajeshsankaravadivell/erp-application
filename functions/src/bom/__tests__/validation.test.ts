import { describe, expect, it } from "vitest";

import { generateDynamicBomRequestSchema } from "../validation";

const VALID_PAYLOAD = {
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

describe("generateDynamicBomRequestSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = generateDynamicBomRequestSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("defaults voltsPerTurnK to 0.45 when omitted", () => {
    const { voltsPerTurnK: _omit, ...rest } = VALID_PAYLOAD.electricalInputs;
    const result = generateDynamicBomRequestSchema.safeParse({ ...VALID_PAYLOAD, electricalInputs: rest });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.electricalInputs.voltsPerTurnK).toBe(0.45);
    }
  });

  it("rejects an invalid phases value", () => {
    const result = generateDynamicBomRequestSchema.safeParse({
      ...VALID_PAYLOAD,
      electricalInputs: { ...VALID_PAYLOAD.electricalInputs, phases: 2 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative kVA", () => {
    const result = generateDynamicBomRequestSchema.safeParse({
      ...VALID_PAYLOAD,
      electricalInputs: { ...VALID_PAYLOAD.electricalInputs, kVA: -100 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid gaugeSystem enum value", () => {
    const result = generateDynamicBomRequestSchema.safeParse({
      ...VALID_PAYLOAD,
      electricalInputs: { ...VALID_PAYLOAD.electricalInputs, gaugeSystem: "XYZ" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing a required field", () => {
    const { coreDiameterMm: _omit, ...rest } = VALID_PAYLOAD.geometricInputs;
    const result = generateDynamicBomRequestSchema.safeParse({ ...VALID_PAYLOAD, geometricInputs: rest });
    expect(result.success).toBe(false);
  });
});
