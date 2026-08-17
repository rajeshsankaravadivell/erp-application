"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getConstants, setConstants } from "@/lib/firestore/master-data";
import { writeAuditLog } from "@/lib/firestore/audit-log";
import { constantsSchema, type ConstantsInput } from "@/lib/validation/master-data";

export type ConstantsActionResult = { ok: true } | { ok: false; error: string };

export async function updateConstantsAction(input: ConstantsInput): Promise<ConstantsActionResult> {
  const user = await requireRole(["Admin"]);

  const parsed = constantsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await getConstants();
  await setConstants(parsed.data, user.uid);

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: before ? "update" : "create",
    collectionPath: "masterData",
    docPath: "masterData/constants",
    before: before ? { ...before } : null,
    after: { ...parsed.data },
  });

  revalidatePath("/admin/master-data/constants");
  return { ok: true };
}
