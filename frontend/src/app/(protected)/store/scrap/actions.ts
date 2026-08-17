"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { logScrap } from "@/lib/firestore/inventory";
import { logScrapSchema } from "@/lib/validation/inventory";
import { writeAuditLog } from "@/lib/firestore/audit-log";

export type LogScrapResult = { ok: true; id: string } | { ok: false; error: string };

export async function logScrapAction(input: unknown): Promise<LogScrapResult> {
  const user = await requireRole(["Admin", "StoreManager"]);

  const parsed = logScrapSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const id = await logScrap(
      parsed.data.material,
      {
        scrapKg: parsed.data.scrapKg,
        reason: parsed.data.reason,
        reference: parsed.data.reference ?? null,
      },
      user.uid,
    );

    await writeAuditLog({
      actorUid: user.uid,
      actorEmail: user.email,
      action: "create",
      collectionPath: "inventory",
      docPath: `inventory/${parsed.data.material}/scrapLedger/${id}`,
      before: null,
      after: { scrapKg: parsed.data.scrapKg, reason: parsed.data.reason },
    });

    revalidatePath("/store");
    revalidatePath("/store/scrap");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to log scrap." };
  }
}
