"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { createDesignAction } from "../actions";
import { callGenerateDynamicBom } from "@/lib/firebase/functions";
import { designInputsSchema, type DesignInputsOutput } from "@/lib/validation/design";
import type { BomResult } from "@/types/design";
import { BomResultPanel } from "../bom-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CoreMaterialOption {
  id: string;
  grade: string;
  thicknessMm: number;
}

function buildEmptyValues(coreMaterials: CoreMaterialOption[]) {
  return {
    name: "",
    electricalInputs: {
      kVA: 100,
      phases: 3 as const,
      primaryVoltageV: 11000,
      secondaryVoltageV: 433,
      frequencyHz: 50,
      regulationPercent: 5,
      voltsPerTurnK: 0.45,
      gaugeSystem: "SWG" as const,
      lvConductorMaterial: "Aluminum" as const,
      hvConductorMaterial: "Copper" as const,
      coreMaterialId: coreMaterials[0]?.id ?? "",
    },
    geometricInputs: {
      coreDiameterMm: 0,
      coreCircuitLengthMm: 0,
      lvRadialBuildMm: 0,
      hvRadialBuildMm: 0,
      lvToCoreClearanceMm: 0,
      hvToLvClearanceMm: 0,
      tankVolumeLiters: 0,
      scrapTolerancePercent: 5,
    },
    commercialInputs: {
      purchasePrice: 0,
      noLoadLossCapitalizationRate: 0,
      loadLossCapitalizationRate: 0,
    },
  };
}

export function DesignConfiguratorForm({ coreMaterials }: { coreMaterials: CoreMaterialOption[] }) {
  const router = useRouter();
  const [bomResult, setBomResult] = useState<BomResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generating, startGenerating] = useTransition();
  const [saving, startSaving] = useTransition();

  const form = useForm<z.input<typeof designInputsSchema>, unknown, DesignInputsOutput>({
    resolver: zodResolver(designInputsSchema),
    defaultValues: buildEmptyValues(coreMaterials),
  });

  function onGenerate(values: DesignInputsOutput) {
    setGenerateError(null);
    startGenerating(async () => {
      const result = await callGenerateDynamicBom({
        electricalInputs: values.electricalInputs,
        geometricInputs: values.geometricInputs,
        commercialInputs: values.commercialInputs,
      });
      if (result.ok) {
        setBomResult(result.data);
        // Use the form's own current (raw, un-coerced) values as the new
        // dirty-check baseline, not the zod-parsed `values` passed in here —
        // those are numbers while the actual fields hold strings, and
        // comparing across that type mismatch left isDirty true right after
        // a successful generate.
        form.reset(form.getValues(), { keepValues: true, keepDirty: false });
      } else {
        setGenerateError(result.error);
      }
    });
  }

  function onSave(values: DesignInputsOutput) {
    setSaveError(null);
    if (!bomResult) return;
    startSaving(async () => {
      const result = await createDesignAction({
        name: values.name,
        electricalInputs: values.electricalInputs,
        geometricInputs: values.geometricInputs,
        commercialInputs: values.commercialInputs,
        dynamicBOM: bomResult,
      });
      if (result.ok) {
        router.push(`/admin/designs/${result.id}`);
      } else {
        setSaveError(result.error);
      }
    });
  }

  const canSave = bomResult !== null && !form.formState.isDirty;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={form.handleSubmit(onGenerate)} className="flex flex-col gap-6">
        {generateError && (
          <Alert variant="destructive">
            <AlertDescription>{generateError}</AlertDescription>
          </Alert>
        )}
        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>New design</CardTitle>
            <CardDescription>Configure inputs, generate a dynamic BOM, then save.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Design name</FieldLabel>
                <Input id="name" placeholder="e.g. Acme Corp — 500kVA Dyn11" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <FieldSet>
          <FieldLegend>Electrical inputs</FieldLegend>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.kVA">kVA</FieldLabel>
              <FieldContent>
                <Input id="electricalInputs.kVA" type="number" step="any" {...form.register("electricalInputs.kVA")} />
                <FieldError errors={[form.formState.errors.electricalInputs?.kVA]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.phases">Phases</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="electricalInputs.phases"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="electricalInputs.phases" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={1}>Single-phase</SelectItem>
                        <SelectItem value={3}>Three-phase</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.phases]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.primaryVoltageV">Primary (HV) voltage (V)</FieldLabel>
              <FieldContent>
                <Input
                  id="electricalInputs.primaryVoltageV"
                  type="number"
                  step="any"
                  {...form.register("electricalInputs.primaryVoltageV")}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.primaryVoltageV]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.secondaryVoltageV">Secondary (LV) voltage (V)</FieldLabel>
              <FieldContent>
                <Input
                  id="electricalInputs.secondaryVoltageV"
                  type="number"
                  step="any"
                  {...form.register("electricalInputs.secondaryVoltageV")}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.secondaryVoltageV]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.frequencyHz">Frequency (Hz)</FieldLabel>
              <FieldContent>
                <Input
                  id="electricalInputs.frequencyHz"
                  type="number"
                  step="any"
                  {...form.register("electricalInputs.frequencyHz")}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.frequencyHz]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.regulationPercent">Regulation (%)</FieldLabel>
              <FieldContent>
                <Input
                  id="electricalInputs.regulationPercent"
                  type="number"
                  step="any"
                  {...form.register("electricalInputs.regulationPercent")}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.regulationPercent]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.voltsPerTurnK">Volts-per-turn K</FieldLabel>
              <FieldContent>
                <Input
                  id="electricalInputs.voltsPerTurnK"
                  type="number"
                  step="any"
                  {...form.register("electricalInputs.voltsPerTurnK")}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.voltsPerTurnK]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.gaugeSystem">Gauge system</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="electricalInputs.gaugeSystem"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="electricalInputs.gaugeSystem" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SWG">SWG</SelectItem>
                        <SelectItem value="AWG">AWG</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.gaugeSystem]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.lvConductorMaterial">LV conductor material</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="electricalInputs.lvConductorMaterial"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="electricalInputs.lvConductorMaterial" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Copper">Copper</SelectItem>
                        <SelectItem value="Aluminum">Aluminum</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.lvConductorMaterial]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.hvConductorMaterial">HV conductor material</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="electricalInputs.hvConductorMaterial"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="electricalInputs.hvConductorMaterial" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Copper">Copper</SelectItem>
                        <SelectItem value="Aluminum">Aluminum</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.hvConductorMaterial]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="electricalInputs.coreMaterialId">Core material</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="electricalInputs.coreMaterialId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="electricalInputs.coreMaterialId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coreMaterials.map((cm) => (
                          <SelectItem key={cm.id} value={cm.id}>
                            {cm.grade} — {cm.thicknessMm}mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.electricalInputs?.coreMaterialId]} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Geometric inputs</FieldLegend>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.coreDiameterMm">Core diameter (mm)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.coreDiameterMm"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.coreDiameterMm")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.coreDiameterMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.coreCircuitLengthMm">Core circuit length (mm)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.coreCircuitLengthMm"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.coreCircuitLengthMm")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.coreCircuitLengthMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.lvRadialBuildMm">LV radial build (mm)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.lvRadialBuildMm"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.lvRadialBuildMm")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.lvRadialBuildMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.hvRadialBuildMm">HV radial build (mm)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.hvRadialBuildMm"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.hvRadialBuildMm")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.hvRadialBuildMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.lvToCoreClearanceMm">LV-to-core clearance (mm)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.lvToCoreClearanceMm"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.lvToCoreClearanceMm")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.lvToCoreClearanceMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.hvToLvClearanceMm">HV-to-LV clearance (mm)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.hvToLvClearanceMm"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.hvToLvClearanceMm")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.hvToLvClearanceMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.tankVolumeLiters">Tank volume (L)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.tankVolumeLiters"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.tankVolumeLiters")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.tankVolumeLiters]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="geometricInputs.scrapTolerancePercent">Scrap tolerance (%)</FieldLabel>
              <FieldContent>
                <Input
                  id="geometricInputs.scrapTolerancePercent"
                  type="number"
                  step="any"
                  {...form.register("geometricInputs.scrapTolerancePercent")}
                />
                <FieldError errors={[form.formState.errors.geometricInputs?.scrapTolerancePercent]} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Commercial inputs</FieldLegend>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="commercialInputs.purchasePrice">Purchase price</FieldLabel>
              <FieldContent>
                <Input
                  id="commercialInputs.purchasePrice"
                  type="number"
                  step="any"
                  {...form.register("commercialInputs.purchasePrice")}
                />
                <FieldError errors={[form.formState.errors.commercialInputs?.purchasePrice]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="commercialInputs.noLoadLossCapitalizationRate">
                No-load loss capitalization rate (A)
              </FieldLabel>
              <FieldContent>
                <Input
                  id="commercialInputs.noLoadLossCapitalizationRate"
                  type="number"
                  step="any"
                  {...form.register("commercialInputs.noLoadLossCapitalizationRate")}
                />
                <FieldError errors={[form.formState.errors.commercialInputs?.noLoadLossCapitalizationRate]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="commercialInputs.loadLossCapitalizationRate">
                Load loss capitalization rate (B)
              </FieldLabel>
              <FieldContent>
                <Input
                  id="commercialInputs.loadLossCapitalizationRate"
                  type="number"
                  step="any"
                  {...form.register("commercialInputs.loadLossCapitalizationRate")}
                />
                <FieldError errors={[form.formState.errors.commercialInputs?.loadLossCapitalizationRate]} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={generating}>
            {generating ? "Generating..." : "Generate BOM"}
          </Button>
          <Button type="button" variant="outline" disabled={!canSave || saving} onClick={form.handleSubmit(onSave)}>
            {saving ? "Saving..." : "Save draft"}
          </Button>
          {bomResult && form.formState.isDirty && (
            <p className="text-sm text-muted-foreground">Inputs changed — regenerate to update results.</p>
          )}
        </div>
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        {bomResult ? (
          <BomResultPanel bomResult={bomResult} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Generate a BOM to see core/winding weights and the TCO/TEC breakdown.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
