import type { Role } from "@/types/user";

export type { Role };

/** Where a freshly-logged-in user of each role lands. */
export const ROLE_HOME: Record<Role, string> = {
  Admin: "/",
  StoreManager: "/",
};
