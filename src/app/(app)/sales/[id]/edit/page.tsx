import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SaleForm } from "@/components/sales/sale-form";
import { requireUser } from "@/lib/auth/require-user";
import { getSale, listSaleCategories, saleToFormValues } from "@/lib/sales/queries";

export const metadata = { title: "Edit sale | DS Finance" };

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [sale, categories] = await Promise.all([getSale(user.id, id), listSaleCategories(user.id)]);
  if (!sale) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${sale.transactionNumber}`} description="Totals are recalculated when you save." />
      <SaleForm categories={categories} defaultValues={saleToFormValues(sale)} saleId={sale.id} cancelHref={`/sales/${sale.id}`} />
    </div>
  );
}
