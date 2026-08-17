"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { receiveStockAction } from "./actions";
import { receiveStockSchema, type ReceiveStockInput } from "@/lib/validation/inventory";
import { INVENTORY_MATERIALS } from "@/types/inventory";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReceiveStockForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<z.input<typeof receiveStockSchema>, unknown, ReceiveStockInput>({
    resolver: zodResolver(receiveStockSchema),
    defaultValues: {
      material: "Copper",
      heatNumber: "",
      receivedKg: 0,
      receivedDate: todayDateInputValue(),
    },
  });

  function onSubmit(values: ReceiveStockInput) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await receiveStockAction(values);
      if (result.ok) {
        setSuccess(true);
        form.reset({
          material: values.material,
          heatNumber: "",
          receivedKg: 0,
          receivedDate: todayDateInputValue(),
        });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>Stock received.</AlertDescription>
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
          <FieldLabel htmlFor="heatNumber">Heat number</FieldLabel>
          <Input id="heatNumber" {...form.register("heatNumber")} />
          <FieldError errors={[form.formState.errors.heatNumber]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="receivedKg">Received (kg)</FieldLabel>
          <Input id="receivedKg" type="number" step="any" {...form.register("receivedKg")} />
          <FieldError errors={[form.formState.errors.receivedKg]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="receivedDate">Received date</FieldLabel>
          <Input id="receivedDate" type="date" {...form.register("receivedDate")} />
          <FieldError errors={[form.formState.errors.receivedDate]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Receive stock"}
      </Button>
    </form>
  );
}
