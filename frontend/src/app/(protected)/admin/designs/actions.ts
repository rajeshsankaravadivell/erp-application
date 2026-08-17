"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { createDesign, getDesign, updateDesignStatus } from "@/lib/firestore/designs";
import {
  reserveInventoryForDesign,
  markDesignPendingProcurement,
  InsufficientStockError,
} from "@/lib/firestore/inventory";
import { writeAuditLog } from "@/lib/firestore/audit-log";
import { designInputsSchema, bomResultSchema } from "@/lib/validation/design";
import type { DesignShortfall, ReservationLine } from "@/types/design";

export type DesignActionResult = { ok: true; id: string } | { ok: false; error: string };
export type DesignMutationResult = { ok: true } | { ok: false; error: string };
export type ApproveDesignResult =
  | { ok: true; reservation: ReservationLine[] }
  | { ok: false; error: string; shortfalls?: DesignShortfall[] };

const LIST_PATH = "/admin/designs";

export interface CreateDesignInput {
  name: unknown;
  electricalInputs: unknown;
  geometricInputs: unknown;
  commercialInputs: unknown;
  /** The BomResult last returned by callGenerateDynamicBom, echoed back by the client. */
  dynamicBOM: unknown;
}

export async function createDesignAction(input: CreateDesignInput): Promise<DesignActionResult> {
  const user = await requireRole(["Admin"]);

  const parsedInputs = designInputsSchema.safeParse({
    name: input.name,
    electricalInputs: input.electricalInputs,
    geometricInputs: input.geometricInputs,
    commercialInputs: input.commercialInputs,
  });
  if (!parsedInputs.success) {
    return { ok: false, error: parsedInputs.error.issues[0]?.message ?? "Invalid input" };
  }

  const parsedBom = bomResultSchema.safeParse(input.dynamicBOM);
  if (!parsedBom.success) {
    return { ok: false, error: "The generated BOM is missing or malformed — regenerate before saving." };
  }

  const id = await createDesign(
    {
      name: parsedInputs.data.name,
      electricalInputs: parsedInputs.data.electricalInputs,
      geometricInputs: parsedInputs.data.geometricInputs,
      commercialInputs: parsedInputs.data.commercialInputs,
      dynamicBOM: parsedBom.data,
    },
    user.uid,
  );

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "create",
    collectionPath: "designs",
    docPath: `designs/${id}`,
    before: null,
    after: {
      name: parsedInputs.data.name,
      status: "Draft",
      kVA: parsedInputs.data.electricalInputs.kVA,
      coreMaterialId: parsedInputs.data.electricalInputs.coreMaterialId,
    },
  });

  revalidatePath(LIST_PATH);
  return { ok: true, id };
}

export async function submitForApprovalAction(id: string): Promise<DesignMutationResult> {
  const user = await requireRole(["Admin"]);

  const design = await getDesign(id);
  if (!design) {
    return { ok: false, error: "Design not found." };
  }
  if (design.status !== "Draft") {
    return { ok: false, error: `Only Draft designs can be submitted for approval (current status: ${design.status}).` };
  }

  await updateDesignStatus(id, "Pending Approval", user.uid);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "update",
    collectionPath: "designs",
    docPath: `designs/${id}`,
    before: { status: design.status },
    after: { status: "Pending Approval" },
  });

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  return { ok: true };
}

/**
 * The Saga Pattern "Hard Reserve": attempts to reserve the design's required
 * Copper/Aluminum/CRGO/Oil against `inventory` in a single Firestore
 * transaction. On success the design becomes Approved; on insufficient stock
 * it's flagged Pending Procurement instead (see reserveInventoryForDesign's
 * transaction for the abort mechanics). Accepts both 'Pending Approval' and
 * 'Pending Procurement' as valid starting states, so a shortfall isn't a dead
 * end — retrying once Store Manager receives more stock is the same action.
 */
export async function approveDesignAction(id: string): Promise<ApproveDesignResult> {
  const user = await requireRole(["Admin"]);

  try {
    const reservation = await reserveInventoryForDesign(id, user.uid);

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "update",
      collectionPath: "designs",
      docPath: `designs/${id}`,
      before: null,
      after: { status: "Approved", reservation },
    });

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true, reservation };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      await markDesignPendingProcurement(id, err.shortfalls, user.uid);

      await writeAuditLog({
        actorUid: user.uid,
        actorEmail: user.email,
        action: "update",
        collectionPath: "designs",
        docPath: `designs/${id}`,
        before: null,
        after: { status: "Pending Procurement", shortfalls: err.shortfalls },
      });

      revalidatePath(LIST_PATH);
      revalidatePath(`${LIST_PATH}/${id}`);
      return { ok: false, error: "Insufficient stock to approve this design.", shortfalls: err.shortfalls };
    }

    return { ok: false, error: err instanceof Error ? err.message : "Failed to approve design." };
  }
}
