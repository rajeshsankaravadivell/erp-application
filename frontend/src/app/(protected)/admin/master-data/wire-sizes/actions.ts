"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import {
  createWireSize,
  deleteWireSize,
  findWireSizeBySystemAndGauge,
  getWireSize,
  updateWireSize,
} from "@/lib/firestore/master-data";
import { writeAuditLog } from "@/lib/firestore/audit-log";
import { wireSizeSchema, type WireSizeInput } from "@/lib/validation/master-data";

export type WireSizeActionResult = { ok: true; id: string } | { ok: false; error: string };
export type WireSizeMutationResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/master-data/wire-sizes";

export async function createWireSizeAction(input: WireSizeInput): Promise<WireSizeActionResult> {
  const user = await requireRole(["Admin"]);

  const parsed = wireSizeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existingId = await findWireSizeBySystemAndGauge(parsed.data.system, parsed.data.gauge);
  if (existingId) {
    return { ok: false, error: `A ${parsed.data.system} ${parsed.data.gauge} entry already exists.` };
  }

  const id = await createWireSize(parsed.data, user.uid);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "create",
    collectionPath: "wireSizes",
    docPath: `wireSizes/${id}`,
    before: null,
    after: { ...parsed.data },
  });

  revalidatePath(PATH);
  return { ok: true, id };
}

export async function updateWireSizeAction(id: string, input: WireSizeInput): Promise<WireSizeMutationResult> {
  const user = await requireRole(["Admin"]);

  const parsed = wireSizeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await getWireSize(id);
  if (!before) {
    return { ok: false, error: "Wire size not found." };
  }

  const existingId = await findWireSizeBySystemAndGauge(parsed.data.system, parsed.data.gauge);
  if (existingId && existingId !== id) {
    return { ok: false, error: `A ${parsed.data.system} ${parsed.data.gauge} entry already exists.` };
  }

  await updateWireSize(id, parsed.data, user.uid);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "update",
    collectionPath: "wireSizes",
    docPath: `wireSizes/${id}`,
    before: { ...before },
    after: { ...parsed.data },
  });

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteWireSizeAction(id: string): Promise<WireSizeMutationResult> {
  const user = await requireRole(["Admin"]);

  const before = await getWireSize(id);
  if (!before) {
    return { ok: false, error: "Wire size not found." };
  }

  await deleteWireSize(id);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "delete",
    collectionPath: "wireSizes",
    docPath: `wireSizes/${id}`,
    before: { ...before },
    after: null,
  });

  revalidatePath(PATH);
  return { ok: true };
}
