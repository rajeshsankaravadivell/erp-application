import type { IssuanceUom } from "@/types/inventory";

export interface ConvertToKgParams {
  uom: IssuanceUom;
  inputValue: number;
  /** design.dynamicBOM[winding].selectedWireSize.bareAreaMm2 */
  bareAreaMm2: number;
  /** design.dynamicBOM[winding].mltMm */
  mltMm: number;
  densityKgPerM3: number;
}

/**
 * Converts a Store Manager's Meters/Turns input into Kg for the inventory
 * ledger. Deliberately pure and side-effect-free (no `server-only`) so it can
 * drive a live preview in the browser — the same reasoning as functions/src/
 * bom's calculation layer. The Server Action re-invokes this authoritatively
 * server-side rather than trusting a client-submitted kg value.
 */
export function convertToKg(params: ConvertToKgParams): number {
  const lengthM = params.uom === "Meters" ? params.inputValue : params.inputValue * (params.mltMm / 1000);
  return lengthM * params.bareAreaMm2 * 1e-6 * params.densityKgPerM3;
}
