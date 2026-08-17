import { z } from "zod";

const wireGaugeSystemSchema = z.enum(["SWG", "AWG"]);
const conductorMaterialSchema = z.enum(["Copper", "Aluminum"]);

const electricalInputsSchema = z.object({
  kVA: z.coerce.number().positive(),
  // Driven by a <Select>, not a native number input, so it's always a real
  // number already — no string coercion needed for this field.
  phases: z.union([z.literal(1), z.literal(3)]),
  primaryVoltageV: z.coerce.number().positive(),
  secondaryVoltageV: z.coerce.number().positive(),
  frequencyHz: z.coerce.number().positive(),
  regulationPercent: z.coerce.number().min(0),
  // Mirrors functions/src/bom/constants.ts's DEFAULT_VOLTS_PER_TURN_K — can't
  // import across packages (no workspace tooling); keep in sync.
  voltsPerTurnK: z.coerce.number().positive().default(0.45),
  gaugeSystem: wireGaugeSystemSchema,
  lvConductorMaterial: conductorMaterialSchema,
  hvConductorMaterial: conductorMaterialSchema,
  coreMaterialId: z.string().trim().min(1, "Core material is required"),
});

const geometricInputsSchema = z.object({
  coreDiameterMm: z.coerce.number().positive(),
  coreCircuitLengthMm: z.coerce.number().positive(),
  lvRadialBuildMm: z.coerce.number().positive(),
  hvRadialBuildMm: z.coerce.number().positive(),
  lvToCoreClearanceMm: z.coerce.number().nonnegative(),
  hvToLvClearanceMm: z.coerce.number().nonnegative(),
  tankVolumeLiters: z.coerce.number().positive(),
  scrapTolerancePercent: z.coerce.number().min(0),
});

const commercialInputsSchema = z.object({
  purchasePrice: z.coerce.number().nonnegative(),
  noLoadLossCapitalizationRate: z.coerce.number().nonnegative(),
  loadLossCapitalizationRate: z.coerce.number().nonnegative(),
});

export const designInputsSchema = z.object({
  name: z.string().trim().min(1, "Design name is required"),
  electricalInputs: electricalInputsSchema,
  geometricInputs: geometricInputsSchema,
  commercialInputs: commercialInputsSchema,
});
export type DesignInputsInput = z.input<typeof designInputsSchema>;
export type DesignInputsOutput = z.output<typeof designInputsSchema>;

// Structural (not recomputation) validation of a client-submitted dynamicBOM
// before persisting — see designs/actions.ts's trust-boundary note. This
// validates a *result* shape, not user input, so it's a separate schema.
const windingResultSchema = z.object({
  ratedCurrentA: z.number(),
  turns: z.number(),
  theoreticalAreaMm2: z.number(),
  selectedWireSize: z.object({ id: z.string(), gauge: z.string(), bareAreaMm2: z.number() }),
  meanDiameterMm: z.number(),
  mltMm: z.number(),
  conductorLengthM: z.number(),
  conductorWeightKg: z.number(),
  resistanceOhm: z.number(),
  loadLossWatts: z.number(),
});

export const bomResultSchema = z.object({
  voltsPerTurn: z.number(),
  core: z.object({
    netIronAreaMm2: z.number(),
    grossCoreAreaMm2: z.number(),
    coreWeightKg: z.number(),
    noLoadLossWatts: z.number(),
  }),
  lv: windingResultSchema,
  hv: windingResultSchema,
  oil: z.object({ activePartDisplacementLiters: z.number(), oilWeightKg: z.number() }),
  tec: z.object({
    noLoadLossWatts: z.number(),
    loadLossWatts: z.number(),
    capitalizedNoLoadLossCost: z.number(),
    capitalizedLoadLossCost: z.number(),
    totalOwnershipCost: z.number(),
  }),
  warnings: z.array(z.string()),
});
