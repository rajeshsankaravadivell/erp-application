"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { logScrapAction } from "./actions";
import { logScrapSchema, type LogScrapInput } from "@/lib/validation/inventory";
import { INVENTORY_MATERIALS } from "@/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY_VALUES = {
  material: "Copper" as const,
  scrapKg: 0,
  reason: "",
  reference: "",
};

export function ScrapFormDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<z.input<typeof logScrapSchema>, unknown, LogScrapInput>({
    resolver: zodResolver(logScrapSchema),
    defaultValues: EMPTY_VALUES,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(EMPTY_VALUES);
      setError(null);
    }
  }

  function onSubmit(values: LogScrapInput) {
    setError(null);
    startTransition(async () => {
      const result = await logScrapAction(values);
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
          <DialogTitle>Log scrap</DialogTitle>
          <DialogDescription>
            Record wasted material. This is an independent log entry, not tied to a specific issuance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="material">Material</FieldLabel>
              <Controller
                control={form.control}
                name="material"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="material" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVENTORY_MATERIALS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.material]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="scrapKg">Scrap (kg)</FieldLabel>
              <Input id="scrapKg" type="number" step="any" {...form.register("scrapKg")} />
              <FieldError errors={[form.formState.errors.scrapKg]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="reason">Reason</FieldLabel>
              <Input id="reason" placeholder="e.g. Winding trim off-cut" {...form.register("reason")} />
              <FieldError errors={[form.formState.errors.reason]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="reference">Reference (optional)</FieldLabel>
              <Input id="reference" placeholder="e.g. design or job number" {...form.register("reference")} />
              <FieldError errors={[form.formState.errors.reference]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Log scrap"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
