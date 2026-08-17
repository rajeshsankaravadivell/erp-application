import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import type { Role, UserDoc } from "@/types/user";

const usersCollection = () => getAdminDb().collection("users");

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await usersCollection().doc(uid).get();
  return snap.exists ? (snap.data() as UserDoc) : null;
}

export async function getUserRole(uid: string): Promise<Role | null> {
  const doc = await getUserDoc(uid);
  return doc?.role ?? null;
}
