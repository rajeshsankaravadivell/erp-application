"use client";

import { useState, useTransition } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { CoreMaterialFormDialog } from "./core-material-form-dialog";
import { deleteCoreMaterialAction } from "./actions";
import type { CoreMaterialInput } from "@/lib/validation/master-data";
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

export function CoreMaterialRowActions({ id, values }: { id: string; values: CoreMaterialInput }) {
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCoreMaterialAction(id);
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
      <CoreMaterialFormDialog
        mode="edit"
        id={id}
        initialValues={values}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Edit core material">
            <PencilIcon />
          </Button>
        }
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Delete core material">
              <Trash2Icon />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {values.grade} @ {values.thicknessMm}mm?
            </AlertDialogTitle>
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
