import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/types/user";

export const SESSION_COOKIE_NAME = "session";
// Firebase session cookies support at most 14 days; we use a shorter window.
const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
    path: "/",
  };
}

export async function verifySession(cookie: string): Promise<DecodedIdToken | null> {
  try {
    return await getAdminAuth().verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

export interface CurrentUser {
  uid: string;
  email: string;
  role: Role;
}

function toCurrentUser(decoded: DecodedIdToken): CurrentUser | null {
  const role = decoded.role as Role | undefined;
  if (!role || !decoded.email) return null;
  return { uid: decoded.uid, email: decoded.email, role };
}

/** Reads and verifies the session cookie for the current request. Never throws. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const decoded = await verifySession(cookie);
  if (!decoded) return null;

  return toCurrentUser(decoded);
}

/**
 * Server Component / Server Action guard. Redirects unauthenticated users to
 * /login and wrong-role users to /forbidden. This duplicates the check
 * `proxy.ts` already performs for page navigations — deliberately, since
 * Server Actions are independently-invocable endpoints that proxy.ts's
 * matcher does not cover.
 */
export async function requireRole(allowed: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/forbidden");
  return user;
}
