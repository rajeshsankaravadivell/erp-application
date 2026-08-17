import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BomResult, WindingResult } from "@/types/design";

function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function WindingCard({ label, winding }: { label: string; winding: WindingResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label} winding</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <Stat label="Rated current" value={`${formatNumber(winding.ratedCurrentA)} A`} />
        <Stat label="Turns" value={formatNumber(winding.turns, 0)} />
        <Stat label="Theoretical area" value={`${formatNumber(winding.theoreticalAreaMm2, 4)} mm²`} />
        <Stat
          label="Wire size"
          value={`${winding.selectedWireSize.gauge} (${formatNumber(winding.selectedWireSize.bareAreaMm2, 3)} mm²)`}
        />
        <Stat label="Mean diameter" value={`${formatNumber(winding.meanDiameterMm, 1)} mm`} />
        <Stat label="MLT" value={`${formatNumber(winding.mltMm, 1)} mm`} />
        <Stat label="Conductor length" value={`${formatNumber(winding.conductorLengthM, 1)} m`} />
        <Stat label="Conductor weight" value={`${formatNumber(winding.conductorWeightKg)} kg`} />
        <Stat label="Resistance" value={`${formatNumber(winding.resistanceOhm, 4)} Ω`} />
        <Stat label="Load loss" value={`${formatNumber(winding.loadLossWatts)} W`} />
      </CardContent>
    </Card>
  );
}

export function BomResultPanel({ bomResult }: { bomResult: BomResult }) {
  return (
    <div className="flex flex-col gap-4">
      {bomResult.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {bomResult.warnings.map((warning, i) => (
            <Alert key={i} variant="destructive">
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>Total ownership cost</CardTitle>
          <CardDescription>Purchase price plus capitalized no-load and load losses</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-3xl font-semibold tabular-nums">{formatCurrency(bomResult.tec.totalOwnershipCost)}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <Stat label="No-load loss" value={`${formatNumber(bomResult.tec.noLoadLossWatts)} W`} />
            <Stat label="Capitalized no-load loss cost" value={formatCurrency(bomResult.tec.capitalizedNoLoadLossCost)} />
            <Stat label="Load loss" value={`${formatNumber(bomResult.tec.loadLossWatts)} W`} />
            <Stat label="Capitalized load loss cost" value={formatCurrency(bomResult.tec.capitalizedLoadLossCost)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Stat label="Volts per turn" value={formatNumber(bomResult.voltsPerTurn, 4)} />
          <Stat label="Net iron area" value={`${formatNumber(bomResult.core.netIronAreaMm2)} mm²`} />
          <Stat label="Gross core area" value={`${formatNumber(bomResult.core.grossCoreAreaMm2)} mm²`} />
          <Stat label="Core weight" value={`${formatNumber(bomResult.core.coreWeightKg)} kg`} />
          <Stat label="No-load loss" value={`${formatNumber(bomResult.core.noLoadLossWatts)} W`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <WindingCard label="LV" winding={bomResult.lv} />
        <WindingCard label="HV" winding={bomResult.hv} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Stat label="Active part displacement" value={`${formatNumber(bomResult.oil.activePartDisplacementLiters)} L`} />
          <Stat label="Oil weight" value={`${formatNumber(bomResult.oil.oilWeightKg)} kg`} />
        </CardContent>
      </Card>
    </div>
  );
}
