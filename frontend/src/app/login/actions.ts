"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { Role } from "@/types/user";

export type LoginResult = { ok: false; error: "NOT_PROVISIONED" | "INVALID_TOKEN" };

/**
 * Exchanges a freshly-minted Firebase ID token (the client SDK already
 * validated the password) for an HttpOnly session cookie. Never receives a
 * password itself.
 */
export async function loginAction(idToken: string): Promise<LoginResult> {
  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return { ok: false, error: "INVALID_TOKEN" };
  }

  const role = decoded.role as Role | undefined;
  if (!role) {
    // No custom claim set — reject rather than create a session with no role.
    return { ok: false, error: "NOT_PROVISIONED" };
  }

  const sessionCookie = await createSessionCookie(idToken);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, sessionCookieOptions());

  redirect(ROLE_HOME[role]);
}
