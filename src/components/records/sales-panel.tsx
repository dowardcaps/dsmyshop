import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { SaleForm } from "@/components/sales/sale-form";
import { SalesTable } from "@/components/sales/sales-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { todayInManila } from "@/lib/dates";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { getSale, listSales, saleToFormValues } from "@/lib/sales/queries";
import { hasActiveFilters, type SaleFilters } from "@/lib/validation/sale-filters";

interface SalesPanelProps {
  userId: string;
  filters: SaleFilters;
  categories: { id: string; name: string }[];
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function SalesPanel({ userId, filters, categories, hrefs, openNew, editId }: SalesPanelProps) {
  const [result, editing] = await Promise.all([listSales(userId, filters), editId ? getSale(userId, editId) : null]);
  const filtered = hasActiveFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> New sale
      </Link>
    </Button>
  );

  return (
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={filtered ? "No sales match your filters" : "No sales yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record your first sale, or import your existing Excel records later."}
          action={filtered ? <ClearFiltersButton tab="sales" /> : addButton}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "sale" : "sales"} ·{" "}
            <span className="font-medium text-foreground">{formatPeso(result.totalAmount)}</span> total
            {filtered ? " (filtered)" : ""}
          </p>
          <SalesTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew && categories.length > 0 ? (
        <RecordDialog title="New sale" description="Add one or more items. The total is calculated for you." closeHref={hrefs.closeHref} size="lg">
          <SaleForm
            categories={categories}
            returnHref={hrefs.closeHref}
            defaultValues={{
              transactionDate: todayInManila(),
              customerName: "",
              paymentMethod: "CASH",
              notes: "",
              items: [{ categoryId: categories[0].id, description: "", quantity: 1, unitPrice: Number.NaN }],
            }}
          />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title={`Edit ${editing.transactionNumber}`} description="Totals are recalculated when you save." closeHref={hrefs.closeHref} size="lg">
          <SaleForm categories={categories} defaultValues={saleToFormValues(editing)} saleId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
