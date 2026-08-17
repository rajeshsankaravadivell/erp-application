import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { listCoreMaterials } from "@/lib/firestore/master-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DesignConfiguratorForm } from "./design-configurator-form";

export default async function NewDesignPage() {
  await requireRole(["Admin"]);
  const coreMaterials = await listCoreMaterials();

  if (coreMaterials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New design</CardTitle>
          <CardDescription>No core materials are configured yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Add at least one core material before configuring a design.{" "}
              <Link href="/admin/master-data/core-materials" className="underline underline-offset-4">
                Go to Core materials
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <DesignConfiguratorForm
      coreMaterials={coreMaterials.map((cm) => ({ id: cm.id, grade: cm.grade, thicknessMm: cm.thicknessMm }))}
    />
  );
}
