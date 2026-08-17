import { EMF_FORM_FACTOR, RESISTIVITY_OHM_MM2_PER_M } from "./constants";
import { interpolateLossCurve } from "./interpolate";
import { NoEligibleWireSizeError } from "./errors";
import type {
  GenerateDynamicBomRequest,
  MasterData,
  BomResult,
  WindingResult,
  CalcWireSize,
  ConductorMaterial,
} from "./types";

function ratedCurrentA(kVA: number, phases: 1 | 3, voltageV: number): number {
  return phases === 3 ? (kVA * 1000) / (Math.sqrt(3) * voltageV) : (kVA * 1000) / voltageV;
}

/** Always rounds UP to the smallest available size — never undersizes a conductor. */
function selectWireSize(
  candidates: CalcWireSize[],
  minAreaMm2: number,
  winding: "LV" | "HV",
  gaugeSystem: string,
): CalcWireSize {
  const eligible = candidates
    .filter((c) => c.bareAreaMm2 >= minAreaMm2)
    .sort((a, b) => a.bareAreaMm2 - b.bareAreaMm2);
  if (eligible.length === 0) {
    throw new NoEligibleWireSizeError(winding, minAreaMm2, gaugeSystem);
  }
  return eligible[0];
}

function currentDensityFor(material: ConductorMaterial, constants: MasterData["constants"]): number {
  return material === "Copper" ? constants.currentDensity.copperAPerMm2 : constants.currentDensity.aluminumAPerMm2;
}

function densityFor(material: ConductorMaterial, constants: MasterData["constants"]): number {
  return material === "Copper" ? constants.densityKgPerM3.copper : constants.densityKgPerM3.aluminum;
}

interface WindingCalcInput {
  label: "LV" | "HV";
  turns: number;
  ratedCurrentA: number;
  material: ConductorMaterial;
  meanDiameterMm: number;
  candidates: CalcWireSize[];
  gaugeSystem: string;
  constants: MasterData["constants"];
  scrapTolerancePercent: number;
}

function calculateWinding(input: WindingCalcInput): WindingResult {
  const delta = currentDensityFor(input.material, input.constants);
  const theoreticalAreaMm2 = input.ratedCurrentA / delta;
  const selected = selectWireSize(input.candidates, theoreticalAreaMm2, input.label, input.gaugeSystem);

  const mltMm = Math.PI * input.meanDiameterMm;
  const conductorLengthM = input.turns * (mltMm / 1000);

  const density = densityFor(input.material, input.constants);
  const conductorWeightKg =
    conductorLengthM * selected.bareAreaMm2 * 1e-6 * density * (1 + input.scrapTolerancePercent / 100);

  const resistivity = RESISTIVITY_OHM_MM2_PER_M[input.material];
  const resistanceOhm = (resistivity * conductorLengthM) / selected.bareAreaMm2;
  const loadLossWatts = input.ratedCurrentA ** 2 * resistanceOhm;

  return {
    ratedCurrentA: input.ratedCurrentA,
    turns: input.turns,
    theoreticalAreaMm2,
    selectedWireSize: selected,
    meanDiameterMm: input.meanDiameterMm,
    mltMm,
    conductorLengthM,
    conductorWeightKg,
    resistanceOhm,
    loadLossWatts,
  };
}

/**
 * The stateless BOM calculation engine — pure function, no Firestore/network
 * dependency. See the Phase 3 plan for the full formula derivation.
 */
export function calculateDynamicBom(request: GenerateDynamicBomRequest, masterData: MasterData): BomResult {
  const { electricalInputs: e, geometricInputs: g, commercialInputs: c } = request;
  const { constants, coreMaterial, wireSizeCandidates } = masterData;
  const warnings: string[] = [];

  // 1. Volts per turn — K is a distinct empirical design constant, NOT the
  // 4.44 EMF form-factor constant (see EMF_FORM_FACTOR / constants.ts).
  const voltsPerTurn = e.voltsPerTurnK * Math.sqrt(e.kVA);

  // 2. Net iron core area (Ai is already NET steel area, per the standard
  // EMF equation — no stacking-factor multiplication here).
  const netIronAreaM2 = voltsPerTurn / (EMF_FORM_FACTOR * e.frequencyHz * constants.bmTesla);
  const netIronAreaMm2 = netIronAreaM2 * 1e6;

  // 3. Turns — secondary gets extra turns to compensate for the expected
  // full-load voltage regulation drop.
  const n1 = Math.round(e.primaryVoltageV / voltsPerTurn);
  const n2 = Math.round((e.secondaryVoltageV * (1 + e.regulationPercent / 100)) / voltsPerTurn);

  // 4. Rated currents
  const hvCurrentA = ratedCurrentA(e.kVA, e.phases, e.primaryVoltageV);
  const lvCurrentA = ratedCurrentA(e.kVA, e.phases, e.secondaryVoltageV);

  // 6. Winding geometry — LV sits directly outside the core, HV outside LV.
  // Each winding's mean diameter = its inner diameter (built up from the
  // core/previous winding + clearances) + its own radial build.
  const lvInnerDiameterMm = g.coreDiameterMm + 2 * g.lvToCoreClearanceMm;
  const lvMeanDiameterMm = lvInnerDiameterMm + g.lvRadialBuildMm;
  const lvOuterDiameterMm = lvInnerDiameterMm + 2 * g.lvRadialBuildMm;
  const hvInnerDiameterMm = lvOuterDiameterMm + 2 * g.hvToLvClearanceMm;
  const hvMeanDiameterMm = hvInnerDiameterMm + g.hvRadialBuildMm;

  const lv = calculateWinding({
    label: "LV",
    turns: n2,
    ratedCurrentA: lvCurrentA,
    material: e.lvConductorMaterial,
    meanDiameterMm: lvMeanDiameterMm,
    candidates: wireSizeCandidates,
    gaugeSystem: e.gaugeSystem,
    constants,
    scrapTolerancePercent: g.scrapTolerancePercent,
  });

  const hv = calculateWinding({
    label: "HV",
    turns: n1,
    ratedCurrentA: hvCurrentA,
    material: e.hvConductorMaterial,
    meanDiameterMm: hvMeanDiameterMm,
    candidates: wireSizeCandidates,
    gaugeSystem: e.gaugeSystem,
    constants,
    scrapTolerancePercent: g.scrapTolerancePercent,
  });

  // Core weight
  const coreCircuitLengthM = g.coreCircuitLengthMm / 1000;
  const coreWeightKg = netIronAreaM2 * coreCircuitLengthM * constants.densityKgPerM3.crgo;

  // Advisory sanity check: does the electrically-required steel fit inside
  // the provided core diameter, accounting for lamination stacking factor?
  const grossCoreAreaMm2 = netIronAreaMm2 / constants.coreStackingFactor;
  const impliedGrossDiameterMm = Math.sqrt((4 * grossCoreAreaMm2) / Math.PI);
  if (impliedGrossDiameterMm > g.coreDiameterMm) {
    warnings.push(
      `Electrically-required gross core diameter (${impliedGrossDiameterMm.toFixed(1)} mm) exceeds the ` +
        `provided coreDiameterMm (${g.coreDiameterMm} mm).`,
    );
  }

  // No-load (core) loss — interpolated at the design's operating Bm.
  const { valueWPerKg, clamped } = interpolateLossCurve(constants.bmTesla, coreMaterial.lossCurve);
  if (clamped) {
    warnings.push(
      `Operating Bm (${constants.bmTesla} T) is outside the selected core material's loss curve range; ` +
        `clamped to the nearest endpoint.`,
    );
  }
  const noLoadLossWatts = coreWeightKg * valueWPerKg;

  // Oil — displacement uses PRE-SCRAP conductor volumes (scrap tolerance is
  // a procurement allowance, not part of the physically wound coil).
  const coreVolumeLiters = netIronAreaM2 * coreCircuitLengthM * 1000;
  const lvConductorVolumeLiters = lv.conductorLengthM * lv.selectedWireSize.bareAreaMm2 * 1e-3;
  const hvConductorVolumeLiters = hv.conductorLengthM * hv.selectedWireSize.bareAreaMm2 * 1e-3;
  const activePartDisplacementLiters = coreVolumeLiters + lvConductorVolumeLiters + hvConductorVolumeLiters;
  const oilWeightKg = (g.tankVolumeLiters - activePartDisplacementLiters) * constants.densityKgPerM3.oil * 0.001;

  // TCO / TEC — purchasePrice, A, B are commercial/tender inputs, not physics.
  const loadLossWatts = lv.loadLossWatts + hv.loadLossWatts;
  const capitalizedNoLoadLossCost = c.noLoadLossCapitalizationRate * noLoadLossWatts;
  const capitalizedLoadLossCost = c.loadLossCapitalizationRate * loadLossWatts;
  const totalOwnershipCost = c.purchasePrice + capitalizedNoLoadLossCost + capitalizedLoadLossCost;

  return {
    voltsPerTurn,
    core: {
      netIronAreaMm2,
      grossCoreAreaMm2,
      coreWeightKg,
      noLoadLossWatts,
    },
    lv,
    hv,
    oil: {
      activePartDisplacementLiters,
      oilWeightKg,
    },
    tec: {
      noLoadLossWatts,
      loadLossWatts,
      capitalizedNoLoadLossCost,
      capitalizedLoadLossCost,
      totalOwnershipCost,
    },
    warnings,
  };
}
