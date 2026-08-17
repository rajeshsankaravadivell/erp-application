import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import type { DesignDoc, DesignStatus } from "@/types/design";

const designs = () => getAdminDb().collection("designs");

export async function listDesigns(): Promise<(DesignDoc & { id: string })[]> {
  const snap = await designs().orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as DesignDoc) }));
}

export async function getDesign(id: string): Promise<(DesignDoc & { id: string }) | null> {
  const snap = await designs().doc(id).get();
  return snap.exists ? { id: snap.id, ...(snap.data() as DesignDoc) } : null;
}

/**
 * Designs available for Store Manager issuance. A single equality filter
 * with no `orderBy` — combining `where('status','==',...)` with
 * `orderBy('createdAt')` on a different field would need a composite index,
 * so this sorts client-side instead over what's expected to be a small set.
 */
export async function listApprovedDesigns(): Promise<(DesignDoc & { id: string })[]> {
  const snap = await designs().where("status", "==", "Approved").get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DesignDoc) }))
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

type CreateDesignData = Omit<DesignDoc, "status" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy">;

export async function createDesign(data: CreateDesignData, uid: string): Promise<string> {
  const ref = await designs().add({
    ...data,
    status: "Draft" satisfies DesignStatus,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  });
  return ref.id;
}

export async function updateDesignStatus(id: string, status: DesignStatus, uid: string): Promise<void> {
  await designs()
    .doc(id)
    .update({ status, updatedAt: FieldValue.serverTimestamp(), updatedBy: uid });
}
