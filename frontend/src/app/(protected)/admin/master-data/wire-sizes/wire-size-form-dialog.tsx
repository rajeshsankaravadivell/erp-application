"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { createWireSizeAction, updateWireSizeAction } from "./actions";
import { wireSizeSchema, type WireSizeInput } from "@/lib/validation/master-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY_VALUES: WireSizeInput = {
  system: "SWG",
  gauge: "",
  bareDiameterMm: 0,
  bareAreaMm2: 0,
  insulatedDiameterMm: 0,
  insulatedAreaMm2: 0,
};

interface WireSizeFormDialogProps {
  mode: "create" | "edit";
  id?: string;
  initialValues?: WireSizeInput;
  trigger: ReactElement;
}

export function WireSizeFormDialog({ mode, id, initialValues, trigger }: WireSizeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // See constants-form.tsx for why this needs the 3-generic useForm form —
  // z.coerce.number() fields have an `unknown` input type but `number` output.
  const form = useForm<z.input<typeof wireSizeSchema>, unknown, WireSizeInput>({
    resolver: zodResolver(wireSizeSchema),
    defaultValues: initialValues ?? EMPTY_VALUES,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(initialValues ?? EMPTY_VALUES);
      setError(null);
    }
  }

  function onSubmit(values: WireSizeInput) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createWireSizeAction(values) : await updateWireSizeAction(id as string, values);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add wire size" : "Edit wire size"}</DialogTitle>
          <DialogDescription>SWG/AWG lookup entry with bare and insulated dimensions.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="system">System</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="system"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="system" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SWG">SWG</SelectItem>
                        <SelectItem value="AWG">AWG</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.system]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="gauge">Gauge</FieldLabel>
              <FieldContent>
                <Input id="gauge" placeholder="e.g. 18 or 4/0" {...form.register("gauge")} />
                <FieldError errors={[form.formState.errors.gauge]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="bareDiameterMm">Bare diameter (mm)</FieldLabel>
              <FieldContent>
                <Input id="bareDiameterMm" type="number" step="any" {...form.register("bareDiameterMm")} />
                <FieldError errors={[form.formState.errors.bareDiameterMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="bareAreaMm2">Bare area (mm²)</FieldLabel>
              <FieldContent>
                <Input id="bareAreaMm2" type="number" step="any" {...form.register("bareAreaMm2")} />
                <FieldError errors={[form.formState.errors.bareAreaMm2]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="insulatedDiameterMm">Insulated diameter (mm)</FieldLabel>
              <FieldContent>
                <Input id="insulatedDiameterMm" type="number" step="any" {...form.register("insulatedDiameterMm")} />
                <FieldError errors={[form.formState.errors.insulatedDiameterMm]} />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldLabel htmlFor="insulatedAreaMm2">Insulated area (mm²)</FieldLabel>
              <FieldContent>
                <Input id="insulatedAreaMm2" type="number" step="any" {...form.register("insulatedAreaMm2")} />
                <FieldError errors={[form.formState.errors.insulatedAreaMm2]} />
              </FieldContent>
            </Field>
          </FieldGroup>

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
