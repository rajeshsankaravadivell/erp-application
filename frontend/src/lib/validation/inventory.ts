import { z } from "zod";

export const inventoryMaterialSchema = z.enum(["Copper", "Aluminum", "CRGO", "Oil"]);

export const receiveStockSchema = z.object({
  material: inventoryMaterialSchema,
  heatNumber: z.string().trim().min(1, "Heat number is required"),
  receivedKg: z.coerce.number().positive(),
  receivedDate: z.coerce.date(),
});
export type ReceiveStockInput = z.output<typeof receiveStockSchema>;

export const logScrapSchema = z.object({
  material: inventoryMaterialSchema,
  scrapKg: z.coerce.number().positive(),
  reason: z.string().trim().min(1, "Reason is required"),
  reference: z.string().trim().optional(),
});
export type LogScrapInput = z.output<typeof logScrapSchema>;

export const issueMaterialSchema = z.object({
  designId: z.string().trim().min(1),
  winding: z.enum(["lv", "hv"]),
  uom: z.enum(["Meters", "Turns"]),
  inputValue: z.coerce.number().positive(),
});
export type IssueMaterialInput = z.output<typeof issueMaterialSchema>;
