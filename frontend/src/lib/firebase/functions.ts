"use client";

import { getFunctions, httpsCallable, FunctionsError } from "firebase/functions";

import { firebaseApp } from "./client";
import type { GenerateDynamicBomRequest, BomResult } from "@/types/design";

// No region argument — functions/src has no region/setGlobalOptions config,
// so the deployed function uses the implicit us-central1 default. Update
// both sides together if that ever changes.
const functionsInstance = getFunctions(firebaseApp);

const generateDynamicBomCallable = httpsCallable<GenerateDynamicBomRequest, BomResult>(
  functionsInstance,
  "generateDynamicBOM",
);

export type CallGenerateDynamicBomResult = { ok: true; data: BomResult } | { ok: false; error: string };

function mapFunctionsError(err: unknown): string {
  if (err instanceof FunctionsError) {
    switch (err.code) {
      case "unauthenticated":
        return "Your session has expired. Please sign in again.";
      case "invalid-argument":
        return err.message || "One or more inputs are invalid.";
      case "failed-precondition":
        // Surfaces the Cloud Function's own message verbatim — e.g. "No SWG
        // wire size large enough for the HV winding (requires >= 12.34 mm²)."
        return err.message || "Required master data is missing or incomplete.";
      default:
        return "BOM calculation failed unexpectedly. Please try again.";
    }
  }
  return "Could not reach the BOM calculation service. Check your connection and try again.";
}

export async function callGenerateDynamicBom(
  request: GenerateDynamicBomRequest,
): Promise<CallGenerateDynamicBomResult> {
  try {
    const response = await generateDynamicBomCallable(request);
    return { ok: true, data: response.data };
  } catch (err) {
    return { ok: false, error: mapFunctionsError(err) };
  }
}
