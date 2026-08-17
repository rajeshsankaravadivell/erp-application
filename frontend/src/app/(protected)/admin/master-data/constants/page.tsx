import { requireRole } from "@/lib/auth/session";
import { getConstants } from "@/lib/firestore/master-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConstantsForm } from "./constants-form";
import type { ConstantsInput } from "@/lib/validation/master-data";

const EMPTY_DEFAULTS: ConstantsInput = {
  bmTesla: 0,
  currentDensity: { copperAPerMm2: 0, aluminumAPerMm2: 0 },
  densityKgPerM3: { copper: 0, aluminum: 0, crgo: 0, oil: 0 },
  coreStackingFactor: 0,
};

export default async function ConstantsPage() {
  await requireRole(["Admin"]);
  const constants = await getConstants();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engineering constants</CardTitle>
        <CardDescription>
          Global variables used by the physics calculation engine. Changes here are recorded in the
          audit log.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConstantsForm
          defaultValues={
            constants
              ? {
                  bmTesla: constants.bmTesla,
                  currentDensity: constants.currentDensity,
                  densityKgPerM3: constants.densityKgPerM3,
                  coreStackingFactor: constants.coreStackingFactor,
                }
              : EMPTY_DEFAULTS
          }
        />
      </CardContent>
    </Card>
  );
}
