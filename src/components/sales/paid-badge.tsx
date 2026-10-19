import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS, type PaymentStatusValue } from "@/lib/sales/constants";

/** Small "Paid" / "Unpaid" tag. Unpaid is highlighted because it is not counted in sales yet. */
export function PaidBadge({ status }: { status: PaymentStatusValue }) {
  return status === "UNPAID" ? (
    <Badge variant="warning" data-testid="status-unpaid">
      {PAYMENT_STATUS_LABELS.UNPAID}
    </Badge>
  ) : (
    <Badge variant="success" data-testid="status-paid">
      {PAYMENT_STATUS_LABELS.PAID}
    </Badge>
  );
}
