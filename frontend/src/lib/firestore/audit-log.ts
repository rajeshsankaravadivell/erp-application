import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import type { AuditLogDoc } from "@/types/audit-log";

/**
 * Appends an entry to the immutable `auditLogs` collection. Nothing calls
 * this yet in Phase 1 — it's the seam Phase 2's Master Data admin UI writes
 * through whenever an Admin changes an engineering constant.
 */
export async function writeAuditLog(entry: Omit<AuditLogDoc, "timestamp">): Promise<string> {
  const ref = await getAdminDb().collection("auditLogs").add({
    ...entry,
    timestamp: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function listAuditLogs(limit = 100): Promise<(AuditLogDoc & { id: string })[]> {
  const snap = await getAdminDb().collection("auditLogs").orderBy("timestamp", "desc").limit(limit).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as AuditLogDoc) }));
}
