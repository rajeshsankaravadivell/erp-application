export class BomCalculationError extends Error {}

export class NoEligibleWireSizeError extends BomCalculationError {
  constructor(
    public readonly winding: "LV" | "HV",
    public readonly requiredAreaMm2: number,
    public readonly gaugeSystem: string,
  ) {
    super(
      `No ${gaugeSystem} wire size large enough for the ${winding} winding ` +
        `(requires >= ${requiredAreaMm2.toFixed(4)} mm²).`,
    );
    this.name = "NoEligibleWireSizeError";
  }
}
