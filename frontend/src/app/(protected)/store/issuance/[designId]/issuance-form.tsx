"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { issueMaterialAction } from "./actions";
import { issueMaterialSchema, type IssueMaterialInput } from "@/lib/validation/inventory";
import { convertToKg } from "@/lib/inventory/dual-uom";
import type { ConductorMaterial } from "@/types/design";
import type { IssuanceUom } from "@/types/inventory";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WindingIssuanceInfo {
  material: ConductorMaterial;
  bareAreaMm2: number;
  mltMm: number;
  conductorWeightKg: number;
  issuedKg: number;
}

interface IssuanceFormProps {
  designId: string;
  lv: WindingIssuanceInfo;
  hv: WindingIssuanceInfo;
  densityKgPerM3: { copper: number; aluminum: number; crgo: number; oil: number };
}

export function IssuanceForm({ designId, lv, hv, densityKgPerM3 }: IssuanceFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<z.input<typeof issueMaterialSchema>, unknown, IssueMaterialInput>({
    resolver: zodResolver(issueMaterialSchema),
    defaultValues: { designId, winding: "lv", uom: "Meters", inputValue: 0 },
  });

  const winding = useWatch({ control: form.control, name: "winding" });
  const uom = useWatch({ control: form.control, name: "uom" }) as IssuanceUom;
  const inputValue = useWatch({ control: form.control, name: "inputValue" });

  const windingInfo = winding === "hv" ? hv : lv;
  const density = windingInfo.material === "Copper" ? densityKgPerM3.copper : densityKgPerM3.aluminum;
  const remainingKg = windingInfo.conductorWeightKg - windingInfo.issuedKg;

  const previewKg = useMemo(() => {
    const value = typeof inputValue === "number" ? inputValue : Number(inputValue);
    if (!uom || !Number.isFinite(value) || value <= 0) return null;
    return convertToKg({
      uom,
      inputValue: value,
      bareAreaMm2: windingInfo.bareAreaMm2,
      mltMm: windingInfo.mltMm,
      densityKgPerM3: density,
    });
  }, [uom, inputValue, windingInfo, density]);

  function onSubmit(values: IssueMaterialInput) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await issueMaterialAction(values);
      if (result.ok) {
        setSuccess(`Issued ${result.computedKg.toFixed(3)}kg.`);
        form.reset({ designId, winding: values.winding, uom: values.uom, inputValue: 0 });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="winding">Winding</FieldLabel>
          <Controller
            control={form.control}
            name="winding"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="winding" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lv">LV ({lv.material})</SelectItem>
                  <SelectItem value="hv">HV ({hv.material})</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="uom">Unit</FieldLabel>
          <Controller
            control={form.control}
            name="uom"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="uom" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meters">Meters</SelectItem>
                  <SelectItem value="Turns">Turns</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="inputValue">{uom === "Turns" ? "Turns" : "Meters"}</FieldLabel>
          <Input id="inputValue" type="number" step="any" {...form.register("inputValue")} />
          <FieldError errors={[form.formState.errors.inputValue]} />
        </Field>
      </FieldGroup>

      <div className="rounded-md border p-3 text-sm">
        <p>
          Remaining budget for this winding:{" "}
          <span className="font-medium tabular-nums">{remainingKg.toFixed(3)} kg</span> of{" "}
          {windingInfo.conductorWeightKg.toFixed(3)} kg
        </p>
        {previewKg !== null && (
          <p className="mt-1">
            This will consume approximately{" "}
            <span className="font-medium tabular-nums">{previewKg.toFixed(3)} kg</span>
            {previewKg > remainingKg && <span className="text-destructive"> — exceeds remaining budget</span>}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Issuing..." : "Issue material"}
      </Button>
    </form>
  );
}
