import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { listApprovedDesigns } from "@/lib/firestore/designs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function IssuancePage() {
  await requireRole(["Admin", "StoreManager"]);
  const designs = await listApprovedDesigns();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issuance</CardTitle>
        <CardDescription>Approved designs available for material issuance.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>kVA</TableHead>
              <TableHead>LV issued</TableHead>
              <TableHead>HV issued</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No approved designs yet.
                </TableCell>
              </TableRow>
            )}
            {designs.map((design) => (
              <TableRow key={design.id}>
                <TableCell>
                  <Link
                    href={`/store/issuance/${design.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {design.name}
                  </Link>
                </TableCell>
                <TableCell>{design.electricalInputs.kVA}</TableCell>
                <TableCell>
                  {(design.issuance?.lv.issuedKg ?? 0).toFixed(3)} / {design.dynamicBOM.lv.conductorWeightKg.toFixed(3)}{" "}
                  kg
                </TableCell>
                <TableCell>
                  {(design.issuance?.hv.issuedKg ?? 0).toFixed(3)} / {design.dynamicBOM.hv.conductorWeightKg.toFixed(3)}{" "}
                  kg
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
