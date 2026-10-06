import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SaleForm } from "@/components/sales/sale-form";
import { requireUser } from "@/lib/auth/require-user";
import { todayInManila } from "@/lib/dates";
import { listSaleCategories } from "@/lib/sales/queries";

export const metadata = { title: "New sale | DS Finance" };

export default async function NewSalePage() {
  const user = await requireUser();
  const categories = await listSaleCategories(user.id);
  // No categories means the seed has not run for this account.
  if (categories.length === 0) redirect("/sales");

  return (
    <div className="space-y-6">
      <PageHeader title="New sale" description="Add one or more items. The total is calculated for you." />
      <SaleForm
        categories={categories}
        cancelHref="/sales"
        defaultValues={{
          transactionDate: todayInManila(),
          customerName: "",
          paymentMethod: "CASH",
          notes: "",
          items: [{ categoryId: categories[0].id, description: "", quantity: 1, unitPrice: Number.NaN }],
        }}
      />
    </div>
  );
}
