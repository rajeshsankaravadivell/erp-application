"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import {
  createCoreMaterial,
  deleteCoreMaterial,
  findCoreMaterialByGradeAndThickness,
  getCoreMaterial,
  updateCoreMaterial,
} from "@/lib/firestore/master-data";
import { writeAuditLog } from "@/lib/firestore/audit-log";
import { coreMaterialSchema, type CoreMaterialInput } from "@/lib/validation/master-data";

export type CoreMaterialActionResult = { ok: true; id: string } | { ok: false; error: string };
export type CoreMaterialMutationResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/master-data/core-materials";

export async function createCoreMaterialAction(input: CoreMaterialInput): Promise<CoreMaterialActionResult> {
  const user = await requireRole(["Admin"]);

  const parsed = coreMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existingId = await findCoreMaterialByGradeAndThickness(parsed.data.grade, parsed.data.thicknessMm);
  if (existingId) {
    return { ok: false, error: `A ${parsed.data.grade} @ ${parsed.data.thicknessMm}mm entry already exists.` };
  }

  const id = await createCoreMaterial(parsed.data, user.uid);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "create",
    collectionPath: "coreMaterials",
    docPath: `coreMaterials/${id}`,
    before: null,
    after: { ...parsed.data },
  });

  revalidatePath(PATH);
  return { ok: true, id };
}

export async function updateCoreMaterialAction(
  id: string,
  input: CoreMaterialInput,
): Promise<CoreMaterialMutationResult> {
  const user = await requireRole(["Admin"]);

  const parsed = coreMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await getCoreMaterial(id);
  if (!before) {
    return { ok: false, error: "Core material not found." };
  }

  const existingId = await findCoreMaterialByGradeAndThickness(parsed.data.grade, parsed.data.thicknessMm);
  if (existingId && existingId !== id) {
    return { ok: false, error: `A ${parsed.data.grade} @ ${parsed.data.thicknessMm}mm entry already exists.` };
  }

  await updateCoreMaterial(id, parsed.data, user.uid);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "update",
    collectionPath: "coreMaterials",
    docPath: `coreMaterials/${id}`,
    before: { ...before },
    after: { ...parsed.data },
  });

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteCoreMaterialAction(id: string): Promise<CoreMaterialMutationResult> {
  const user = await requireRole(["Admin"]);

  const before = await getCoreMaterial(id);
  if (!before) {
    return { ok: false, error: "Core material not found." };
  }

  await deleteCoreMaterial(id);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "delete",
    collectionPath: "coreMaterials",
    docPath: `coreMaterials/${id}`,
    before: { ...before },
    after: null,
  });

  revalidatePath(PATH);
  return { ok: true };
}
