"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function logoutAction(): Promise<never> {
  const user = await getCurrentUser();
  if (user) {
    // Best-effort: invalidate any refresh tokens so a stale ID token can't
    // mint a new session cookie after sign-out.
    await getAdminAuth().revokeRefreshTokens(user.uid).catch(() => {});
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect("/login");
}
