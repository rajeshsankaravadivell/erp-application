"use client";

import { useTransition } from "react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
