// Standard sinusoidal EMF equation form-factor constant (E = 4.44·f·N·Bmax·A).
// Distinct from the volts-per-turn design constant K — see calculate.ts.
export const EMF_FORM_FACTOR = 4.44;

// Empirical volts-per-turn design constant for core-type distribution
// transformers. Typical range ~0.3-0.7 depending on transformer class;
// request-overridable via electricalInputs.voltsPerTurnK.
export const DEFAULT_VOLTS_PER_TURN_K = 0.45;

// Resistivity in Ω·mm²/m at 20°C (standard reference values).
export const RESISTIVITY_OHM_MM2_PER_M = {
  Copper: 0.0168,
  Aluminum: 0.0282,
} as const;
