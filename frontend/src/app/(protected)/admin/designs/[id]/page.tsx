import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getDesign } from "@/lib/firestore/designs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DesignStatusBadge } from "../design-status-badge";
import { BomResultPanel } from "../bom-result-panel";
import { SubmitForApprovalButton } from "./submit-for-approval-button";
import { ApproveDesignButton } from "./approve-design-button";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["Admin"]);
  const { id } = await params;
  const design = await getDesign(id);

  if (!design) {
    notFound();
  }

  const { electricalInputs: e, geometricInputs: g, commercialInputs: c } = design;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>{design.name}</CardTitle>
              <DesignStatusBadge status={design.status} />
            </div>
            <CardDescription>Saved transformer design and its generated dynamic BOM.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {design.status === "Draft" && <SubmitForApprovalButton id={design.id} />}
            {(design.status === "Pending Approval" || design.status === "Pending Procurement") && (
              <ApproveDesignButton id={design.id} isRetry={design.status === "Pending Procurement"} />
            )}
            {design.status === "Pending Procurement" && design.shortfalls && design.shortfalls.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <p>Insufficient stock to approve this design:</p>
                  <ul className="mt-2 list-disc pl-4">
                    {design.shortfalls.map((s) => (
                      <li key={s.material}>
                        {s.material}: needs {s.requiredKg.toFixed(3)}kg, only {s.availableKg.toFixed(3)}kg available
                        (short {s.shortKg.toFixed(3)}kg)
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {design.status === "Approved" && design.reservation && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">Reserved stock</p>
                {design.reservation.map((r) => (
                  <Row key={r.material} label={r.material} value={`${r.reservedKg.toFixed(3)} kg`} />
                ))}
                {design.issuance && (
                  <>
                    <p className="mt-2 text-sm font-medium">Issued so far</p>
                    <Row label="LV" value={`${design.issuance.lv.issuedKg.toFixed(3)} kg`} />
                    <Row label="HV" value={`${design.issuance.hv.issuedKg.toFixed(3)} kg`} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Electrical inputs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Row label="kVA" value={e.kVA} />
            <Row label="Phases" value={e.phases === 3 ? "Three-phase" : "Single-phase"} />
            <Row label="Primary (HV) voltage" value={`${e.primaryVoltageV} V`} />
            <Row label="Secondary (LV) voltage" value={`${e.secondaryVoltageV} V`} />
            <Row label="Frequency" value={`${e.frequencyHz} Hz`} />
            <Row label="Regulation" value={`${e.regulationPercent}%`} />
            <Row label="Volts-per-turn K" value={e.voltsPerTurnK} />
            <Row label="Gauge system" value={e.gaugeSystem} />
            <Row label="LV conductor material" value={e.lvConductorMaterial} />
            <Row label="HV conductor material" value={e.hvConductorMaterial} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geometric inputs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Row label="Core diameter" value={`${g.coreDiameterMm} mm`} />
            <Row label="Core circuit length" value={`${g.coreCircuitLengthMm} mm`} />
            <Row label="LV radial build" value={`${g.lvRadialBuildMm} mm`} />
            <Row label="HV radial build" value={`${g.hvRadialBuildMm} mm`} />
            <Row label="LV-to-core clearance" value={`${g.lvToCoreClearanceMm} mm`} />
            <Row label="HV-to-LV clearance" value={`${g.hvToLvClearanceMm} mm`} />
            <Row label="Tank volume" value={`${g.tankVolumeLiters} L`} />
            <Row label="Scrap tolerance" value={`${g.scrapTolerancePercent}%`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commercial inputs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Row label="Purchase price" value={c.purchasePrice} />
            <Row label="No-load loss capitalization rate (A)" value={c.noLoadLossCapitalizationRate} />
            <Row label="Load loss capitalization rate (B)" value={c.loadLossCapitalizationRate} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <BomResultPanel bomResult={design.dynamicBOM} />
      </div>
    </div>
  );
}
