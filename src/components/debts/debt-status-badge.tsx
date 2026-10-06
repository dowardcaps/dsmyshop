import { Badge } from "@/components/ui/badge";
import { DEBT_STATUS_LABELS, type DebtStatusValue } from "@/lib/debts/constants";

const VARIANT: Record<DebtStatusValue, "warning" | "info" | "success"> = {
  UNPAID: "warning",
  PARTIALLY_PAID: "info",
  PAID: "success",
};

export function DebtStatusBadge({ status }: { status: DebtStatusValue }) {
  return <Badge variant={VARIANT[status]}>{DEBT_STATUS_LABELS[status]}</Badge>;
}
