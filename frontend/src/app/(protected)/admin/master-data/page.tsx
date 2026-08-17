import Link from "next/link";
import { SlidersHorizontalIcon, CableIcon, LayersIcon, ScrollTextIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/admin/master-data/constants",
    icon: SlidersHorizontalIcon,
    title: "Constants",
    description: "Flux density, current density, and material densities.",
  },
  {
    href: "/admin/master-data/wire-sizes",
    icon: CableIcon,
    title: "Wire sizes",
    description: "SWG/AWG lookup table for bare and insulated conductor areas.",
  },
  {
    href: "/admin/master-data/core-materials",
    icon: LayersIcon,
    title: "Core materials",
    description: "CRGO grades, thicknesses, and core-loss curves.",
  },
  {
    href: "/admin/master-data/audit-log",
    icon: ScrollTextIcon,
    title: "Audit log",
    description: "Immutable ledger of every Master Data change.",
  },
];

export default async function MasterDataPage() {
  await requireRole(["Admin"]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map(({ href, icon: Icon, title, description }) => (
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
  );
}
