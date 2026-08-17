"use client";

import { useState, useTransition } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { WireSizeFormDialog } from "./wire-size-form-dialog";
import { deleteWireSizeAction } from "./actions";
import type { WireSizeInput } from "@/lib/validation/master-data";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function WireSizeRowActions({ id, values }: { id: string; values: WireSizeInput }) {
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteWireSizeAction(id);
      if (result.ok) {
        setDeleteOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && (
        <Alert variant="destructive" className="mr-2 py-1">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <WireSizeFormDialog
        mode="edit"
        id={id}
        initialValues={values}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Edit wire size">
            <PencilIcon />
          </Button>
        }
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Delete wire size">
              <Trash2Icon />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {values.system} {values.gauge}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={handleDelete}>
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
