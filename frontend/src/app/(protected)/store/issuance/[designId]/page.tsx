import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getDesign } from "@/lib/firestore/designs";
import { listIssuances } from "@/lib/firestore/inventory";
import { getConstants } from "@/lib/firestore/master-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IssuanceForm } from "./issuance-form";

export default async function IssuanceDetailPage({ params }: { params: Promise<{ designId: string }> }) {
  await requireRole(["Admin", "StoreManager"]);
  const { designId } = await params;

  const [design, issuances, constants] = await Promise.all([
    getDesign(designId),
    listIssuances(designId),
    getConstants(),
  ]);

  if (!design) {
    notFound();
  }

  if (design.status !== "Approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{design.name}</CardTitle>
          <CardDescription>
            This design is not Approved (current status: {design.status}) — issuance is unavailable.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!constants) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{design.name}</CardTitle>
          <CardDescription>masterData/constants has not been configured — issuance is unavailable.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{design.name}</CardTitle>
          <CardDescription>Issue wire against this design&apos;s Hard Reserve.</CardDescription>
        </CardHeader>
        <CardContent>
          <IssuanceForm
            designId={design.id}
            lv={{
              material: design.electricalInputs.lvConductorMaterial,
              bareAreaMm2: design.dynamicBOM.lv.selectedWireSize.bareAreaMm2,
              mltMm: design.dynamicBOM.lv.mltMm,
              conductorWeightKg: design.dynamicBOM.lv.conductorWeightKg,
              issuedKg: design.issuance?.lv.issuedKg ?? 0,
            }}
            hv={{
              material: design.electricalInputs.hvConductorMaterial,
              bareAreaMm2: design.dynamicBOM.hv.selectedWireSize.bareAreaMm2,
              mltMm: design.dynamicBOM.hv.mltMm,
              conductorWeightKg: design.dynamicBOM.hv.conductorWeightKg,
              issuedKg: design.issuance?.hv.issuedKg ?? 0,
            }}
            densityKgPerM3={constants.densityKgPerM3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issuance history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Winding</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Kg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No issuances yet.
                  </TableCell>
                </TableRow>
              )}
              {issuances.map((issuance) => (
                <TableRow key={issuance.id}>
                  <TableCell className="uppercase">{issuance.winding}</TableCell>
                  <TableCell>{issuance.material}</TableCell>
                  <TableCell>
                    {issuance.inputValue} {issuance.uom}
                  </TableCell>
                  <TableCell>{issuance.computedKg.toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
