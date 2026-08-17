"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { updateConstantsAction } from "./actions";
import { constantsSchema, type ConstantsInput } from "@/lib/validation/master-data";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ConstantsForm({ defaultValues }: { defaultValues: ConstantsInput }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  // z.coerce.number() fields have an `unknown` input type but a `number`
  // output type — the 3-generic useForm form tells react-hook-form that
  // form values are the (possibly-string) input shape while handleSubmit's
  // callback receives the validated/coerced output shape.
  const form = useForm<z.input<typeof constantsSchema>, unknown, ConstantsInput>({
    resolver: zodResolver(constantsSchema),
    defaultValues,
  });

  function onSubmit(values: ConstantsInput) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateConstantsAction(values);
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>Constants saved.</AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldLegend>Core</FieldLegend>
        <FieldGroup>
          <Field orientation="responsive">
            <FieldLabel htmlFor="bmTesla">Bm (Tesla)</FieldLabel>
            <FieldContent>
              <Input id="bmTesla" type="number" step="any" {...form.register("bmTesla")} />
              <FieldError errors={[form.formState.errors.bmTesla]} />
            </FieldContent>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor="coreStackingFactor">Stacking factor</FieldLabel>
            <FieldContent>
              <Input
                id="coreStackingFactor"
                type="number"
                step="any"
                {...form.register("coreStackingFactor")}
              />
              <FieldError errors={[form.formState.errors.coreStackingFactor]} />
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Current density (A/mm²)</FieldLegend>
        <FieldGroup>
          <Field orientation="responsive">
            <FieldLabel htmlFor="currentDensity.copperAPerMm2">Copper</FieldLabel>
            <FieldContent>
              <Input
                id="currentDensity.copperAPerMm2"
                type="number"
                step="any"
                {...form.register("currentDensity.copperAPerMm2")}
              />
              <FieldError errors={[form.formState.errors.currentDensity?.copperAPerMm2]} />
            </FieldContent>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor="currentDensity.aluminumAPerMm2">Aluminum</FieldLabel>
            <FieldContent>
              <Input
                id="currentDensity.aluminumAPerMm2"
                type="number"
                step="any"
                {...form.register("currentDensity.aluminumAPerMm2")}
              />
              <FieldError errors={[form.formState.errors.currentDensity?.aluminumAPerMm2]} />
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Material densities (kg/m³)</FieldLegend>
        <FieldGroup>
          <Field orientation="responsive">
            <FieldLabel htmlFor="densityKgPerM3.copper">Copper</FieldLabel>
            <FieldContent>
              <Input id="densityKgPerM3.copper" type="number" step="any" {...form.register("densityKgPerM3.copper")} />
              <FieldError errors={[form.formState.errors.densityKgPerM3?.copper]} />
            </FieldContent>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor="densityKgPerM3.aluminum">Aluminum</FieldLabel>
            <FieldContent>
              <Input
                id="densityKgPerM3.aluminum"
                type="number"
                step="any"
                {...form.register("densityKgPerM3.aluminum")}
              />
              <FieldError errors={[form.formState.errors.densityKgPerM3?.aluminum]} />
            </FieldContent>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor="densityKgPerM3.crgo">CRGO steel</FieldLabel>
            <FieldContent>
              <Input id="densityKgPerM3.crgo" type="number" step="any" {...form.register("densityKgPerM3.crgo")} />
              <FieldError errors={[form.formState.errors.densityKgPerM3?.crgo]} />
            </FieldContent>
          </Field>
          <Field orientation="responsive">
            <FieldLabel htmlFor="densityKgPerM3.oil">Oil</FieldLabel>
            <FieldContent>
              <Input id="densityKgPerM3.oil" type="number" step="any" {...form.register("densityKgPerM3.oil")} />
              <FieldError errors={[form.formState.errors.densityKgPerM3?.oil]} />
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Save constants"}
      </Button>
    </form>
  );
}
