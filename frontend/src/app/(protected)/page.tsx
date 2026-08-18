import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const user = await requireRole(["Admin", "StoreManager"]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.email}</CardTitle>
          <CardDescription>
            Signed in as <span className="font-medium">{user.role}</span>. This is the Phase 1
            foundation shell — Master Data, the design configurator, and inventory modules land in
            later phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          {user.role === "Admin" && (
            <Link href="/admin" className="text-primary underline underline-offset-4">
              Admin area
            </Link>
          )}
          <Link href="/store" className="text-primary underline underline-offset-4">
            Store area
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
