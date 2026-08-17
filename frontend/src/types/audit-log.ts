import type { Timestamp } from "firebase-admin/firestore";

export type AuditAction = "create" | "update" | "delete";

/**
 * Firestore document at `auditLogs/{autoId}` — an append-only ledger.
 * Firestore security rules deny update/delete on this collection entirely,
 * so once written a doc never changes.
 */
export interface AuditLogDoc {
  timestamp: Timestamp;
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  /** e.g. 'masterData/constants' */
  collectionPath: string;
  /** full path of the document that changed */
  docPath: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}
