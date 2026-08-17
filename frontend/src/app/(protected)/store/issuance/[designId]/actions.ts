"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { issueMaterialForDesign } from "@/lib/firestore/inventory";
import { issueMaterialSchema } from "@/lib/validation/inventory";
import { writeAuditLog } from "@/lib/firestore/audit-log";

export type IssueMaterialResult = { ok: true; computedKg: number } | { ok: false; error: string };

export async function issueMaterialAction(input: unknown): Promise<IssueMaterialResult> {
  const user = await requireRole(["Admin", "StoreManager"]);

  const parsed = issueMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const { computedKg } = await issueMaterialForDesign(
      parsed.data.designId,
      parsed.data.winding,
      parsed.data.uom,
      parsed.data.inputValue,
      user.uid,
    );

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "create",
      collectionPath: "designs",
      docPath: `designs/${parsed.data.designId}/issuances`,
      before: null,
      after: {
        winding: parsed.data.winding,
        uom: parsed.data.uom,
        inputValue: parsed.data.inputValue,
        computedKg,
      },
    });

    revalidatePath("/store/issuance");
    revalidatePath(`/store/issuance/${parsed.data.designId}`);
    revalidatePath("/store");
    return { ok: true, computedKg };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to issue material." };
  }
}
