import Link from "next/link";
import { PackagePlusIcon, SendIcon, ScissorsIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { listInventory } from "@/lib/firestore/inventory";
import { INVENTORY_MATERIALS } from "@/types/inventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const NAV_CARDS = [
  { href: "/store/receive-stock", icon: PackagePlusIcon, title: "Receive stock", description: "Log a new batch (heat number) received into inventory." },
  { href: "/store/issuance", icon: SendIcon, title: "Issuance", description: "Issue wire against an approved design's Hard Reserve, in Meters or Turns." },
  { href: "/store/scrap", icon: ScissorsIcon, title: "Scrap ledger", description: "Log off-cuts and waste." },
];

export default async function StorePage() {
  await requireRole(["Admin", "StoreManager"]);
  const inventory = await listInventory();
  const byMaterial = new Map(inventory.map((i) => [i.id, i]));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Available and reserved stock, tracked strictly in Kg.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Available (kg)</TableHead>
                <TableHead>Reserved (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVENTORY_MATERIALS.map((material) => {
                const doc = byMaterial.get(material);
                return (
                  <TableRow key={material}>
                    <TableCell>{material}</TableCell>
                    <TableCell>{(doc?.availableKg ?? 0).toFixed(3)}</TableCell>
                    <TableCell>{(doc?.reservedKg ?? 0).toFixed(3)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {NAV_CARDS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <Icon className="mb-2 size-5 text-muted-foreground" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
