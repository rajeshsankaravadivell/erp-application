import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";

vi.mock("../../lib/admin", () => ({
  getAdminDb: vi.fn(() => ({})),
}));

vi.mock("../repository", () => ({
  fetchConstants: vi.fn(),
  fetchCoreMaterial: vi.fn(),
  fetchWireSizesForSystem: vi.fn(),
}));

import functionsTest from "firebase-functions-test";
import { generateDynamicBOM } from "../../generateDynamicBom";
import * as repository from "../repository";

const testEnv = functionsTest();
afterAll(() => testEnv.cleanup());

const wrapped = testEnv.wrap(generateDynamicBOM);

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

const VALID_MASTER_DATA = {
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
    { id: "w15", gauge: "15", bareAreaMm2: 2.627 },
    { id: "w10", gauge: "10", bareAreaMm2: 84.0 },
  ],
};

function authedRequest(data: unknown): CallableRequest {
  return {
    data,
    auth: { uid: "test-uid", token: {}, rawToken: "" },
  } as unknown as CallableRequest;
}

function unauthedRequest(data: unknown): CallableRequest {
  return { data } as unknown as CallableRequest;
}

describe("generateDynamicBOM handler", () => {
  beforeEach(() => {
    vi.mocked(repository.fetchConstants).mockReset();
    vi.mocked(repository.fetchCoreMaterial).mockReset();
    vi.mocked(repository.fetchWireSizesForSystem).mockReset();
  });

  it("throws unauthenticated when there is no auth context", async () => {
    await expect(wrapped(unauthedRequest(VALID_PAYLOAD))).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("throws invalid-argument for a malformed payload", async () => {
    await expect(wrapped(authedRequest({ electricalInputs: {} }))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("throws failed-precondition when constants are not configured", async () => {
    vi.mocked(repository.fetchConstants).mockResolvedValue(null);
    vi.mocked(repository.fetchCoreMaterial).mockResolvedValue(VALID_MASTER_DATA.coreMaterial);
    vi.mocked(repository.fetchWireSizesForSystem).mockResolvedValue(VALID_MASTER_DATA.wireSizeCandidates);

    await expect(wrapped(authedRequest(VALID_PAYLOAD))).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("throws failed-precondition when the requested core material doesn't exist", async () => {
    vi.mocked(repository.fetchConstants).mockResolvedValue(VALID_MASTER_DATA.constants);
    vi.mocked(repository.fetchCoreMaterial).mockResolvedValue(null);
    vi.mocked(repository.fetchWireSizesForSystem).mockResolvedValue(VALID_MASTER_DATA.wireSizeCandidates);

    await expect(wrapped(authedRequest(VALID_PAYLOAD))).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("throws failed-precondition when no wireSizes exist for the requested gauge system", async () => {
    vi.mocked(repository.fetchConstants).mockResolvedValue(VALID_MASTER_DATA.constants);
    vi.mocked(repository.fetchCoreMaterial).mockResolvedValue(VALID_MASTER_DATA.coreMaterial);
    vi.mocked(repository.fetchWireSizesForSystem).mockResolvedValue([]);

    await expect(wrapped(authedRequest(VALID_PAYLOAD))).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("throws failed-precondition (translated from NoEligibleWireSizeError) when no wire size is large enough", async () => {
    vi.mocked(repository.fetchConstants).mockResolvedValue(VALID_MASTER_DATA.constants);
    vi.mocked(repository.fetchCoreMaterial).mockResolvedValue(VALID_MASTER_DATA.coreMaterial);
    vi.mocked(repository.fetchWireSizesForSystem).mockResolvedValue([
      { id: "tiny", gauge: "40", bareAreaMm2: 0.01 },
    ]);

    await expect(wrapped(authedRequest(VALID_PAYLOAD))).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("returns a computed BOM for a fully valid, authenticated request", async () => {
    vi.mocked(repository.fetchConstants).mockResolvedValue(VALID_MASTER_DATA.constants);
    vi.mocked(repository.fetchCoreMaterial).mockResolvedValue(VALID_MASTER_DATA.coreMaterial);
    vi.mocked(repository.fetchWireSizesForSystem).mockResolvedValue(VALID_MASTER_DATA.wireSizeCandidates);

    const result = await wrapped(authedRequest(VALID_PAYLOAD));
    expect(result.voltsPerTurn).toBeCloseTo(4.5, 6);
    expect(result.hv.turns).toBe(2444);
    expect(result.lv.turns).toBe(101);
  });
});
