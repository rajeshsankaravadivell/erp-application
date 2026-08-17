import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { listDesigns } from "@/lib/firestore/designs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DesignStatusBadge } from "./design-status-badge";

export default async function DesignsPage() {
  await requireRole(["Admin"]);
  const designs = await listDesigns();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Designs</CardTitle>
        <CardDescription>Transformer design iterations and their generated dynamic BOMs.</CardDescription>
        <div className="mt-2">
          <Button size="sm" nativeButton={false} render={<Link href="/admin/designs/new" />}>
            <PlusIcon /> New design
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>kVA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No designs yet.
                </TableCell>
              </TableRow>
            )}
            {designs.map((design) => (
              <TableRow key={design.id}>
                <TableCell>
                  <Link href={`/admin/designs/${design.id}`} className="text-primary underline-offset-4 hover:underline">
                    {design.name}
                  </Link>
                </TableCell>
                <TableCell>{design.electricalInputs.kVA}</TableCell>
                <TableCell>
                  <DesignStatusBadge status={design.status} />
                </TableCell>
                <TableCell>{design.createdAt?.toDate().toLocaleDateString() ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
