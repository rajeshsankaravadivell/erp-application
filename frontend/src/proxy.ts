import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import type { Role } from "@/types/user";

// Proxy files always run on the Node.js runtime in this Next.js version, so
// firebase-admin (and its `verifySessionCookie` call) works directly here —
// no Edge/Node split needed. See firestore.rules and lib/auth/session.ts for
// the matching server-side re-check used by Server Actions.
export default async function proxy(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const decoded = cookie ? await verifySession(cookie) : null;

  if (!decoded) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = decoded.role as Role | undefined;
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  if (path.startsWith("/store") && role !== "Admin" && role !== "StoreManager") {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/store/:path*"],
};
