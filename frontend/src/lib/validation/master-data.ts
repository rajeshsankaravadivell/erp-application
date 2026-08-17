import { z } from "zod";

export const currentDensitySchema = z.object({
  copperAPerMm2: z.coerce.number().positive(),
  aluminumAPerMm2: z.coerce.number().positive(),
});

export const densitySchema = z.object({
  copper: z.coerce.number().positive(),
  aluminum: z.coerce.number().positive(),
  crgo: z.coerce.number().positive(),
  oil: z.coerce.number().positive(),
});

export const constantsSchema = z.object({
  // CRGO saturates around 2T; 3 is a generous sanity ceiling.
  bmTesla: z.coerce.number().positive().max(3),
  currentDensity: currentDensitySchema,
  densityKgPerM3: densitySchema,
  // Lamination stacking factor as a fraction; CRGO is typically 0.90-0.97.
  coreStackingFactor: z.coerce.number().positive().max(1),
});
export type ConstantsInput = z.infer<typeof constantsSchema>;

export const wireSizeSchema = z
  .object({
    system: z.enum(["SWG", "AWG"]),
    gauge: z.string().trim().min(1, "Gauge is required"),
    bareDiameterMm: z.coerce.number().positive(),
    bareAreaMm2: z.coerce.number().positive(),
    insulatedDiameterMm: z.coerce.number().positive(),
    insulatedAreaMm2: z.coerce.number().positive(),
  })
  .refine((d) => d.insulatedDiameterMm >= d.bareDiameterMm, {
    message: "Insulated diameter must be ≥ bare diameter",
    path: ["insulatedDiameterMm"],
  })
  .refine((d) => d.insulatedAreaMm2 >= d.bareAreaMm2, {
    message: "Insulated area must be ≥ bare area",
    path: ["insulatedAreaMm2"],
  });
export type WireSizeInput = z.infer<typeof wireSizeSchema>;

export const lossCurvePointSchema = z.object({
  bmTesla: z.coerce.number().positive().max(3),
  lossWPerKg: z.coerce.number().nonnegative(),
});

export const coreMaterialSchema = z.object({
  grade: z.string().trim().min(1, "Grade is required"),
  thicknessMm: z.coerce.number().positive(),
  lossCurve: z
    .array(lossCurvePointSchema)
    .min(2, "At least 2 points are required to interpolate a curve")
    .refine((pts) => new Set(pts.map((p) => p.bmTesla)).size === pts.length, {
      message: "Bm values must be unique",
    }),
});
export type CoreMaterialInput = z.infer<typeof coreMaterialSchema>;
