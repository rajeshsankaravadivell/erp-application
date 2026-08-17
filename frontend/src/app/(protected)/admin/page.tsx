import Link from "next/link";
import { DatabaseIcon, DraftingCompassIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  await requireRole(["Admin"]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/admin/master-data">
        <Card className="h-full transition-colors hover:bg-muted/50">
          <CardHeader>
            <DatabaseIcon className="mb-2 size-5 text-muted-foreground" />
            <CardTitle>Master Data</CardTitle>
            <CardDescription>
              Manage engineering constants, wire sizes, core materials, and the audit log.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
      <Link href="/admin/designs">
        <Card className="h-full transition-colors hover:bg-muted/50">
          <CardHeader>
            <DraftingCompassIcon className="mb-2 size-5 text-muted-foreground" />
            <CardTitle>Designs</CardTitle>
            <CardDescription>
              Configure transformer designs, generate dynamic BOMs, and review TCO/TEC.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
