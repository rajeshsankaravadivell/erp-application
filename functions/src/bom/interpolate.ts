import type { LossCurvePoint } from "./types";

export interface InterpolationResult {
  valueWPerKg: number;
  clamped: boolean;
}

/**
 * Linearly interpolates a core-loss curve at a given flux density. Clamps to
 * the nearest endpoint (and reports it) if `bmTesla` falls outside the
 * curve's range, rather than extrapolating.
 */
export function interpolateLossCurve(bmTesla: number, curve: LossCurvePoint[]): InterpolationResult {
  if (curve.length === 0) {
    throw new Error("Cannot interpolate an empty loss curve.");
  }

  // Defensively re-sort — Phase 2's write path already sorts ascending by
  // bmTesla, but this function shouldn't silently depend on that holding
  // forever for every possible caller.
  const sorted = [...curve].sort((a, b) => a.bmTesla - b.bmTesla);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (bmTesla <= first.bmTesla) {
    return { valueWPerKg: first.lossWPerKg, clamped: bmTesla < first.bmTesla };
  }
  if (bmTesla >= last.bmTesla) {
    return { valueWPerKg: last.lossWPerKg, clamped: bmTesla > last.bmTesla };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i];
    const upper = sorted[i + 1];
    if (bmTesla === lower.bmTesla) {
      return { valueWPerKg: lower.lossWPerKg, clamped: false };
    }
    if (bmTesla > lower.bmTesla && bmTesla < upper.bmTesla) {
      const fraction = (bmTesla - lower.bmTesla) / (upper.bmTesla - lower.bmTesla);
      const valueWPerKg = lower.lossWPerKg + fraction * (upper.lossWPerKg - lower.lossWPerKg);
      return { valueWPerKg, clamped: false };
    }
  }

  // Unreachable given the bracketing checks above and the endpoint checks
  // before the loop, but keeps the function total.
  return { valueWPerKg: last.lossWPerKg, clamped: false };
}
