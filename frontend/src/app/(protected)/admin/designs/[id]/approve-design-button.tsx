"use client";

import { useState, useTransition } from "react";

import { approveDesignAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DesignShortfall } from "@/types/design";

export function ApproveDesignButton({ id, isRetry }: { id: string; isRetry: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [shortfalls, setShortfalls] = useState<DesignShortfall[] | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    setShortfalls(null);
    startTransition(async () => {
      const result = await approveDesignAction(id);
      if (!result.ok) {
        setError(result.error);
        setShortfalls(result.shortfalls ?? null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <p>{error}</p>
            {shortfalls && shortfalls.length > 0 && (
              <ul className="mt-2 list-disc pl-4">
                {shortfalls.map((s) => (
                  <li key={s.material}>
                    {s.material}: needs {s.requiredKg.toFixed(3)}kg, only {s.availableKg.toFixed(3)}kg available
                    (short {s.shortKg.toFixed(3)}kg)
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
      <Button type="button" disabled={pending} onClick={handleClick} className="w-fit">
        {pending ? "Approving..." : isRetry ? "Retry approval" : "Approve design"}
      </Button>
    </div>
  );
}
