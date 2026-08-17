"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { firebaseAuth } from "@/lib/firebase/client";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function mapErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Invalid email or password.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact an administrator.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "NOT_PROVISIONED":
      return "Your account hasn't been set up with a role yet. Contact an administrator.";
    case "INVALID_TOKEN":
      return "Could not verify your session. Please try signing in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      const result = await loginAction(idToken);
      if (result && !result.ok) {
        setError(mapErrorMessage(result.error));
        setSubmitting(false);
      }
      // On success, loginAction redirects server-side; no further action needed here.
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "unknown";
      setError(mapErrorMessage(code));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
