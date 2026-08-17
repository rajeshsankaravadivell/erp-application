import { z } from "zod";

import { DEFAULT_VOLTS_PER_TURN_K } from "./constants";

const wireGaugeSystemSchema = z.enum(["SWG", "AWG"]);
const conductorMaterialSchema = z.enum(["Copper", "Aluminum"]);

const electricalInputsSchema = z.object({
  kVA: z.number().positive(),
  phases: z.union([z.literal(1), z.literal(3)]),
  primaryVoltageV: z.number().positive(),
  secondaryVoltageV: z.number().positive(),
  frequencyHz: z.number().positive(),
  regulationPercent: z.number().min(0),
  voltsPerTurnK: z.number().positive().default(DEFAULT_VOLTS_PER_TURN_K),
  gaugeSystem: wireGaugeSystemSchema,
  lvConductorMaterial: conductorMaterialSchema,
  hvConductorMaterial: conductorMaterialSchema,
  coreMaterialId: z.string().trim().min(1),
});

const geometricInputsSchema = z.object({
  coreDiameterMm: z.number().positive(),
  coreCircuitLengthMm: z.number().positive(),
  lvRadialBuildMm: z.number().positive(),
  hvRadialBuildMm: z.number().positive(),
  lvToCoreClearanceMm: z.number().nonnegative(),
  hvToLvClearanceMm: z.number().nonnegative(),
  tankVolumeLiters: z.number().positive(),
  scrapTolerancePercent: z.number().min(0),
});

const commercialInputsSchema = z.object({
  purchasePrice: z.number().nonnegative(),
  noLoadLossCapitalizationRate: z.number().nonnegative(),
  loadLossCapitalizationRate: z.number().nonnegative(),
});

export const generateDynamicBomRequestSchema = z.object({
  electricalInputs: electricalInputsSchema,
  geometricInputs: geometricInputsSchema,
  commercialInputs: commercialInputsSchema,
});

export type GenerateDynamicBomRequestParsed = z.output<typeof generateDynamicBomRequestSchema>;
