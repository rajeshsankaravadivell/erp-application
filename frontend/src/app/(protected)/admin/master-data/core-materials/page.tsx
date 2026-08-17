import { PlusIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { listCoreMaterials } from "@/lib/firestore/master-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoreMaterialFormDialog } from "./core-material-form-dialog";
import { CoreMaterialRowActions } from "./core-material-row-actions";

export default async function CoreMaterialsPage() {
  await requireRole(["Admin"]);
  const coreMaterials = await listCoreMaterials();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core materials</CardTitle>
        <CardDescription>CRGO grades, thicknesses, and their core-loss curves vs. flux density.</CardDescription>
        <div className="mt-2">
          <CoreMaterialFormDialog
            mode="create"
            trigger={
              <Button size="sm">
                <PlusIcon /> Add core material
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Thickness (mm)</TableHead>
              <TableHead>Loss curve points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coreMaterials.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No core materials yet.
                </TableCell>
              </TableRow>
            )}
            {coreMaterials.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.grade}</TableCell>
                <TableCell>{m.thicknessMm}</TableCell>
                <TableCell>
                  {m.lossCurve.map((p) => `${p.bmTesla}T→${p.lossWPerKg}W/kg`).join(", ")}
                </TableCell>
                <TableCell className="text-right">
                  <CoreMaterialRowActions
                    id={m.id}
                    values={{ grade: m.grade, thicknessMm: m.thicknessMm, lossCurve: m.lossCurve }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
