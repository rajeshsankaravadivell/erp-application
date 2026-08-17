import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { getAdminDb } from "./lib/admin";
import { generateDynamicBomRequestSchema } from "./bom/validation";
import { fetchConstants, fetchCoreMaterial, fetchWireSizesForSystem } from "./bom/repository";
import { calculateDynamicBom } from "./bom/calculate";
import { NoEligibleWireSizeError } from "./bom/errors";
import type { BomResult } from "./bom/types";

/**
 * Stateless BOM calculation microservice. Takes electrical/geometric/
 * commercial design inputs, reads the currently-configured masterData
 * (constants, chosen core material, gauge-system wire sizes), and returns a
 * compiled dynamic BOM. Writes nothing to Firestore itself — persisting a
 * result into a `designs` doc is a later phase's concern once the Design
 * Configurator UI exists to call this and save the outcome.
 *
 * Any authenticated user (Admin or StoreManager) may call this — both roles
 * already have Firestore read access to everything it touches, and it's
 * read-only/pure, so restricting to Admin-only would be a false boundary.
 */
export const generateDynamicBOM = onCall(async (request: CallableRequest<unknown>): Promise<BomResult> => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign-in required.");
  }

  const parsed = generateDynamicBomRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const db = getAdminDb();
  const { electricalInputs } = parsed.data;

  const [constants, coreMaterial, wireSizeCandidates] = await Promise.all([
    fetchConstants(db),
    fetchCoreMaterial(db, electricalInputs.coreMaterialId),
    fetchWireSizesForSystem(db, electricalInputs.gaugeSystem),
  ]);

  if (!constants) {
    throw new HttpsError(
      "failed-precondition",
      "masterData/constants has not been fully configured (including coreStackingFactor).",
    );
  }
  if (!coreMaterial) {
    throw new HttpsError("failed-precondition", `coreMaterials/${electricalInputs.coreMaterialId} not found.`);
  }
  if (wireSizeCandidates.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      `No wireSizes entries exist for gauge system ${electricalInputs.gaugeSystem}.`,
    );
  }

  try {
    return calculateDynamicBom(parsed.data, { constants, coreMaterial, wireSizeCandidates });
  } catch (err) {
    if (err instanceof NoEligibleWireSizeError) {
      throw new HttpsError("failed-precondition", err.message);
    }
    logger.error("generateDynamicBOM: unexpected calculation failure", err);
    throw new HttpsError("internal", "BOM calculation failed unexpectedly.");
  }
});
