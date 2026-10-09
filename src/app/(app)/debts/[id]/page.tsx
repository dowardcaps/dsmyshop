import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

import { DebtStatusBadge } from "@/components/debts/debt-status-badge";
import { PaymentDialog } from "@/components/debts/payment-dialog";
import { PaymentsTable } from "@/components/debts/payments-table";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteDebtAction } from "@/lib/actions/debts";
import { requireUser } from "@/lib/auth/require-user";
import { toCents } from "@/lib/cents";
import { debtPercentPaid } from "@/lib/debts/calc";
import { getDebt } from "@/lib/debts/queries";
import { formatDate, formatPeso } from "@/lib/format";

export const metadata = { title: "Debt details | DS Finance" };

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const debt = await getDebt(user.id, id);
  if (!debt) notFound();

  const percent = debtPercentPaid(toCents(debt.originalAmount), toCents(debt.totalPaid));
  const paidOff = debt.status === "PAID";
  const stats = [
    { label: "Original debt", value: formatPeso(debt.originalAmount) },
    { label: "Total payments", value: formatPeso(debt.totalPaid) },
    { label: "Remaining balance", value: formatPeso(debt.balance) },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/records?tab=debts">
          <ArrowLeft /> Back to debts
        </Link>
      </Button>

      <PageHeader
        title={debt.name}
        description={`Since ${formatDate(debt.debtDate, { year: "numeric", month: "long", day: "numeric" })}`}
        actions={
          <>
            <PaymentDialog debtId={debt.id} maxAmount={debt.balance}>
              <Button disabled={paidOff} title={paidOff ? "This debt is fully paid" : undefined}>
                <Plus /> Record payment
              </Button>
            </PaymentDialog>
            <Button asChild variant="outline">
              <Link href={`/records?tab=debts&edit=${debt.id}`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDeleteButton
              action={deleteDebtAction.bind(null, debt.id)}
              title="Delete this debt?"
              description={`"${debt.name}" will be permanently removed. This cannot be undone.`}
              successMessage={`Deleted ${debt.name}.`}
              confirmLabel="Delete debt"
              redirectTo="/records?tab=debts"
              disabled={debt.paymentCount > 0}
              disabledReason="Delete the payments first, or keep this debt as a record."
            />
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <DebtStatusBadge status={debt.status} />
            <span className="text-sm text-muted-foreground">{percent}% paid</span>
          </div>
          <div
            role="progressbar"
            aria-label="Percent of the debt paid"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
          {debt.description ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{debt.description}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {debt.payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <PaymentsTable debtId={debt.id} payments={debt.payments} balance={debt.balance} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
