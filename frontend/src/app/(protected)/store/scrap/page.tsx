import { PlusIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { listScrapLedger } from "@/lib/firestore/inventory";
import { INVENTORY_MATERIALS } from "@/types/inventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrapFormDialog } from "./scrap-form-dialog";

export default async function ScrapPage() {
  await requireRole(["Admin", "StoreManager"]);

  const perMaterial = await Promise.all(
    INVENTORY_MATERIALS.map(async (material) => {
      const entries = await listScrapLedger(material);
      return entries.map((entry) => ({ ...entry, material }));
    }),
  );
  const entries = perMaterial.flat().sort((a, b) => b.recordedAt.toMillis() - a.recordedAt.toMillis());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrap ledger</CardTitle>
        <CardDescription>Independent log of off-cuts and waste, by material.</CardDescription>
        <div className="mt-2">
          <ScrapFormDialog
            trigger={
              <Button size="sm">
                <PlusIcon /> Log scrap
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Kg</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No scrap logged yet.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={`${entry.material}-${entry.id}`}>
                <TableCell className="whitespace-nowrap">{entry.recordedAt.toDate().toLocaleDateString()}</TableCell>
                <TableCell>{entry.material}</TableCell>
                <TableCell>{entry.scrapKg.toFixed(3)}</TableCell>
                <TableCell>{entry.reason}</TableCell>
                <TableCell>{entry.reference ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
