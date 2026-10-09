import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SaleItemsTable } from "@/components/sales/sale-items-table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSaleAction } from "@/lib/actions/sales";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/sales/constants";
import { getSale } from "@/lib/sales/queries";

export const metadata = { title: "Sale details | DS Finance" };

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const sale = await getSale(user.id, id);
  if (!sale) notFound();

  const details: [string, string][] = [
    ["Date", formatDate(sale.transactionDate, { year: "numeric", month: "long", day: "numeric" })],
    ["Customer", sale.customerName ?? "Walk-in"],
    ["Payment method", PAYMENT_METHOD_LABELS[sale.paymentMethod]],
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/records?tab=sales">
          <ArrowLeft /> Back to sales
        </Link>
      </Button>
      <PageHeader
        title={sale.transactionNumber}
        description="Sale details"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/records?tab=sales&edit=${sale.id}`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDeleteButton
              action={deleteSaleAction.bind(null, sale.id)}
              title="Delete this sale?"
              description={`${sale.transactionNumber} and all of its items will be permanently removed. This cannot be undone.`}
              successMessage={`Deleted ${sale.transactionNumber}.`}
              confirmLabel="Delete sale"
              redirectTo="/records?tab=sales"
            />
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 font-medium">{value}</p>
            </div>
          ))}
          {sale.notes ? (
            <div className="sm:col-span-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{sale.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <SaleItemsTable items={sale.items} totalAmount={sale.totalAmount} />
        </CardContent>
      </Card>
    </div>
  );
}
