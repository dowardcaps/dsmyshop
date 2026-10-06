import Link from "next/link";
import { HandCoins, Plus } from "lucide-react";

import { DebtFiltersBar } from "@/components/debts/debt-filters";
import { DebtsTable } from "@/components/debts/debts-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { listDebts } from "@/lib/debts/queries";
import { formatPeso } from "@/lib/format";
import { debtFiltersToQuery, hasActiveDebtFilters, parseDebtFilters } from "@/lib/validation/debt-filters";
import type { RawSearchParams } from "@/lib/validation/filter-utils";

export const metadata = { title: "Debts | DS Finance" };

export default async function DebtsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const filters = parseDebtFilters(await searchParams);
  const result = await listDebts(user.id, filters);
  const filtered = hasActiveDebtFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href="/debts/new">
        <Plus /> Add debt
      </Link>
    </Button>
  );

  const stats = [
    { label: "Original debt", value: result.totals.original },
    { label: "Total payments", value: result.totals.paid },
    { label: "Outstanding", value: result.totals.outstanding },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Debts" description="Debts, payments, and balances." actions={addButton} />
      <DebtFiltersBar filters={filters} />

      {result.total === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={filtered ? "No debts match your filters" : "No debts yet"}
          description={filtered ? "Try a different search or clear the filters." : "Add a debt to track payments and the remaining balance."}
          action={filtered ? <Button asChild variant="outline"><Link href="/debts">Clear filters</Link></Button> : addButton}
        />
      ) : (
        <>
          <section aria-label={filtered ? "Summary of filtered debts" : "Summary of all debts"} className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="gap-1 py-4">
                <CardContent>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                    {filtered ? " (filtered)" : ""}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPeso(stat.value)}</p>
                </CardContent>
              </Card>
            ))}
          </section>
          <DebtsTable rows={result.rows} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefForPage={(page) => `/debts${debtFiltersToQuery(filters, page)}`}
          />
        </>
      )}
    </div>
  );
}
