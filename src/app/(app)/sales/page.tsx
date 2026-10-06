import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SaleFiltersBar } from "@/components/sales/sale-filters";
import { SalesTable } from "@/components/sales/sales-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { formatPeso } from "@/lib/format";
import { listSaleCategories, listSales } from "@/lib/sales/queries";
import { hasActiveFilters, parseSaleFilters, saleFiltersToQuery } from "@/lib/validation/sale-filters";

export const metadata = { title: "Sales | DS Finance" };

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const filters = parseSaleFilters(await searchParams);
  const [categories, result] = await Promise.all([listSaleCategories(user.id), listSales(user.id, filters)]);
  const filtered = hasActiveFilters(filters);

  const newSaleButton = (
    <Button asChild>
      <Link href="/sales/new">
        <Plus /> New sale
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description="Daily sales transactions and line items." actions={newSaleButton} />
      <SaleFiltersBar filters={filters} categories={categories} />

      {result.total === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={filtered ? "No sales match your filters" : "No sales yet"}
          description={
            filtered
              ? "Try a different search or clear the filters."
              : "Record your first sale, or import your existing Excel records later."
          }
          action={filtered ? <Button asChild variant="outline"><Link href="/sales">Clear filters</Link></Button> : newSaleButton}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "sale" : "sales"} ·{" "}
            <span className="font-medium text-foreground">{formatPeso(result.totalAmount)}</span> total
            {filtered ? " (filtered)" : ""}
          </p>
          <SalesTable rows={result.rows} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefForPage={(page) => `/sales${saleFiltersToQuery(filters, page)}`}
          />
        </>
      )}
    </div>
  );
}
