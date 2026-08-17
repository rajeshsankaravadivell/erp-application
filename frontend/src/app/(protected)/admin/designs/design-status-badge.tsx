import { Badge } from "@/components/ui/badge";
import type { DesignStatus } from "@/types/design";

const VARIANT_BY_STATUS: Record<DesignStatus, "secondary" | "outline" | "default" | "destructive"> = {
  Draft: "secondary",
  "Pending Approval": "outline",
  Approved: "default",
  "Pending Procurement": "destructive",
  Procured: "secondary",
};

export function DesignStatusBadge({ status }: { status: DesignStatus }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{status}</Badge>;
}
