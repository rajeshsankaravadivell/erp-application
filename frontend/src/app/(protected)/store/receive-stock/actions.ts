"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { receiveStock } from "@/lib/firestore/inventory";
import { receiveStockSchema } from "@/lib/validation/inventory";
import { writeAuditLog } from "@/lib/firestore/audit-log";

export type ReceiveStockResult = { ok: true; id: string } | { ok: false; error: string };

export async function receiveStockAction(input: unknown): Promise<ReceiveStockResult> {
  const user = await requireRole(["Admin", "StoreManager"]);

  const parsed = receiveStockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const id = await receiveStock(
    parsed.data.material,
    {
      heatNumber: parsed.data.heatNumber,
      receivedKg: parsed.data.receivedKg,
      receivedDate: parsed.data.receivedDate,
    },
    user.uid,
  );

  await writeAuditLog({
    actorUid: user.uid,
    actorEmail: user.email,
    action: "create",
    collectionPath: "inventory",
    docPath: `inventory/${parsed.data.material}/batches/${id}`,
    before: null,
    after: { heatNumber: parsed.data.heatNumber, receivedKg: parsed.data.receivedKg },
  });

  revalidatePath("/store");
  revalidatePath("/store/receive-stock");
  return { ok: true, id };
}
