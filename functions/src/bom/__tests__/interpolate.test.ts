import { describe, expect, it } from "vitest";

import { interpolateLossCurve } from "../interpolate";
import type { LossCurvePoint } from "../types";

const CURVE: LossCurvePoint[] = [
  { bmTesla: 1.0, lossWPerKg: 0.8 },
  { bmTesla: 1.5, lossWPerKg: 1.5 },
  { bmTesla: 1.7, lossWPerKg: 2.0 },
];

describe("interpolateLossCurve", () => {
  it("interpolates linearly between two bracketing points", () => {
    const result = interpolateLossCurve(1.6, CURVE);
    expect(result.valueWPerKg).toBeCloseTo(1.75, 6);
    expect(result.clamped).toBe(false);
  });

  it("returns the exact value when bmTesla matches a curve point exactly", () => {
    const result = interpolateLossCurve(1.5, CURVE);
    expect(result.valueWPerKg).toBeCloseTo(1.5, 6);
    expect(result.clamped).toBe(false);
  });

  it("returns the first point's value without clamping when bmTesla equals the lower bound", () => {
    const result = interpolateLossCurve(1.0, CURVE);
    expect(result.valueWPerKg).toBeCloseTo(0.8, 6);
    expect(result.clamped).toBe(false);
  });

  it("clamps to the first point below the curve's range", () => {
    const result = interpolateLossCurve(0.5, CURVE);
    expect(result.valueWPerKg).toBeCloseTo(0.8, 6);
    expect(result.clamped).toBe(true);
  });

  it("clamps to the last point above the curve's range", () => {
    const result = interpolateLossCurve(1.9, CURVE);
    expect(result.valueWPerKg).toBeCloseTo(2.0, 6);
    expect(result.clamped).toBe(true);
  });

  it("works correctly even if the input curve isn't pre-sorted", () => {
    const shuffled = [CURVE[2], CURVE[0], CURVE[1]];
    const result = interpolateLossCurve(1.6, shuffled);
    expect(result.valueWPerKg).toBeCloseTo(1.75, 6);
  });

  it("throws on an empty curve", () => {
    expect(() => interpolateLossCurve(1.5, [])).toThrow();
  });
});
