import { PlusIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { listWireSizes } from "@/lib/firestore/master-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WireSizeFormDialog } from "./wire-size-form-dialog";
import { WireSizeRowActions } from "./wire-size-row-actions";

export default async function WireSizesPage() {
  await requireRole(["Admin"]);
  const wireSizes = await listWireSizes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wire sizes</CardTitle>
        <CardDescription>SWG/AWG lookup table for bare and insulated conductor areas.</CardDescription>
        <div className="mt-2">
          <WireSizeFormDialog
            mode="create"
            trigger={
              <Button size="sm">
                <PlusIcon /> Add wire size
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System</TableHead>
              <TableHead>Gauge</TableHead>
              <TableHead>Bare Ø (mm)</TableHead>
              <TableHead>Bare area (mm²)</TableHead>
              <TableHead>Insulated Ø (mm)</TableHead>
              <TableHead>Insulated area (mm²)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wireSizes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No wire sizes yet.
                </TableCell>
              </TableRow>
            )}
            {wireSizes.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.system}</TableCell>
                <TableCell>{w.gauge}</TableCell>
                <TableCell>{w.bareDiameterMm}</TableCell>
                <TableCell>{w.bareAreaMm2}</TableCell>
                <TableCell>{w.insulatedDiameterMm}</TableCell>
                <TableCell>{w.insulatedAreaMm2}</TableCell>
                <TableCell className="text-right">
                  <WireSizeRowActions
                    id={w.id}
                    values={{
                      system: w.system,
                      gauge: w.gauge,
                      bareDiameterMm: w.bareDiameterMm,
                      bareAreaMm2: w.bareAreaMm2,
                      insulatedDiameterMm: w.insulatedDiameterMm,
                      insulatedAreaMm2: w.insulatedAreaMm2,
                    }}
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
