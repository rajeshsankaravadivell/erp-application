import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiveStockForm } from "./receive-stock-form";

export default async function ReceiveStockPage() {
  await requireRole(["Admin", "StoreManager"]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive stock</CardTitle>
        <CardDescription>Log a new batch (heat number) into inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <ReceiveStockForm />
      </CardContent>
    </Card>
  );
}
