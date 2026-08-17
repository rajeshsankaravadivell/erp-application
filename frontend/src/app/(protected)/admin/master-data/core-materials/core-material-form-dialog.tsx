"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { z } from "zod";

import { createCoreMaterialAction, updateCoreMaterialAction } from "./actions";
import { coreMaterialSchema, type CoreMaterialInput } from "@/lib/validation/master-data";
import { CORE_MATERIAL_GRADE_SUGGESTIONS } from "@/types/master-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EMPTY_VALUES: CoreMaterialInput = {
  grade: "",
  thicknessMm: 0,
  lossCurve: [
    { bmTesla: 0, lossWPerKg: 0 },
    { bmTesla: 0, lossWPerKg: 0 },
  ],
};

interface CoreMaterialFormDialogProps {
  mode: "create" | "edit";
  id?: string;
  initialValues?: CoreMaterialInput;
  trigger: ReactElement;
}

export function CoreMaterialFormDialog({ mode, id, initialValues, trigger }: CoreMaterialFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // See constants-form.tsx for why this needs the 3-generic useForm form —
  // z.coerce.number() fields have an `unknown` input type but `number` output.
  const form = useForm<z.input<typeof coreMaterialSchema>, unknown, CoreMaterialInput>({
    resolver: zodResolver(coreMaterialSchema),
    defaultValues: initialValues ?? EMPTY_VALUES,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lossCurve" });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(initialValues ?? EMPTY_VALUES);
      setError(null);
    }
  }

  function onSubmit(values: CoreMaterialInput) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCoreMaterialAction(values)
          : await updateCoreMaterialAction(id as string, values);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  const lossCurveError = (form.formState.errors.lossCurve as { message?: string } | undefined)?.message;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add core material" : "Edit core material"}</DialogTitle>
          <DialogDescription>CRGO grade, thickness, and its core-loss curve vs. Bm.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="grade">Grade</FieldLabel>
              <FieldContent>
                <Input id="grade" list="grade-suggestions" placeholder="e.g. M4" {...form.register("grade")} />
                <datalist id="grade-suggestions">
                  {CORE_MATERIAL_GRADE_SUGGESTIONS.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <FieldError errors={[form.formState.errors.grade]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="thicknessMm">Thickness (mm)</FieldLabel>
              <FieldContent>
                <Input id="thicknessMm" type="number" step="any" {...form.register("thicknessMm")} />
                <FieldError errors={[form.formState.errors.thicknessMm]} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <FieldSet>
            <FieldLegend>Loss curve (Bm vs. W/kg)</FieldLegend>
            <FieldGroup>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <Field className="flex-1">
                    <FieldLabel htmlFor={`lossCurve.${index}.bmTesla`}>Bm (T)</FieldLabel>
                    <Input
                      id={`lossCurve.${index}.bmTesla`}
                      type="number"
                      step="any"
                      {...form.register(`lossCurve.${index}.bmTesla` as const)}
                    />
                  </Field>
                  <Field className="flex-1">
                    <FieldLabel htmlFor={`lossCurve.${index}.lossWPerKg`}>Loss (W/kg)</FieldLabel>
                    <Input
                      id={`lossCurve.${index}.lossWPerKg`}
                      type="number"
                      step="any"
                      {...form.register(`lossCurve.${index}.lossWPerKg` as const)}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove point"
                    disabled={fields.length <= 2}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              {lossCurveError && <p className="text-sm text-destructive">{lossCurveError}</p>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => append({ bmTesla: 0, lossWPerKg: 0 })}
              >
                <PlusIcon /> Add point
              </Button>
            </FieldGroup>
          </FieldSet>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : mode === "create" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
