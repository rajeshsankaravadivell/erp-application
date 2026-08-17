import type { Timestamp } from "firebase-admin/firestore";

export type Role = "Admin" | "StoreManager";

export const ROLES: readonly Role[] = ["Admin", "StoreManager"];

/**
 * Firestore document at `users/{uid}` — the doc ID always equals the
 * Firebase Auth uid, mirroring the auth user 1:1.
 */
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** uid of the Admin who created this user, or 'seed-script' for bootstrap accounts. */
  createdBy: string;
}
