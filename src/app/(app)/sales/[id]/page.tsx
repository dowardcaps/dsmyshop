import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteSaleAction } from "@/lib/actions/sales";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate, formatPeso } from "@/lib/format";
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
        <Link href="/sales">
          <ArrowLeft /> Back to sales
        </Link>
      </Button>
      <PageHeader
        title={sale.transactionNumber}
        description="Sale details"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/sales/${sale.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDeleteButton
              action={deleteSaleAction.bind(null, sale.id)}
              title="Delete this sale?"
              description={`${sale.transactionNumber} and all of its items will be permanently removed. This cannot be undone.`}
              successMessage={`Deleted ${sale.transactionNumber}.`}
              confirmLabel="Delete sale"
              redirectTo="/sales"
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPeso(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatPeso(item.subtotal)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="text-right font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right text-base font-semibold tabular-nums">{formatPeso(sale.totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
