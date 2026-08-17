"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, setFirebaseUser);
  }, [setFirebaseUser]);

  return <>{children}</>;
}
