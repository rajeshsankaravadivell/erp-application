"use client";

import { useState, useTransition } from "react";

import { submitForApprovalAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SubmitForApprovalButton({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await submitForApprovalAction(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="button" disabled={pending} onClick={handleClick} className="w-fit">
        {pending ? "Submitting..." : "Submit for approval"}
      </Button>
    </div>
  );
}
