import Link from "next/link";
import { Plus, Smartphone } from "lucide-react";

import { GcashFiltersBar } from "@/components/gcash/gcash-filters";
import { GcashSummary } from "@/components/gcash/gcash-summary";
import { GcashTable } from "@/components/gcash/gcash-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { listGcashTransactions } from "@/lib/gcash/queries";
import type { RawSearchParams } from "@/lib/validation/filter-utils";
import { gcashFiltersToQuery, hasActiveGcashFilters, parseGcashFilters } from "@/lib/validation/gcash-filters";

export const metadata = { title: "GCash Transactions | DS Finance" };

export default async function GcashPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const filters = parseGcashFilters(await searchParams);
  const result = await listGcashTransactions(user.id, filters);
  const filtered = hasActiveGcashFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href="/gcash/new">
        <Plus /> Add transaction
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="GCash Transactions" description="Cash in, cash out, and load transactions." actions={addButton} />
      <GcashFiltersBar filters={filters} />

      {result.total === 0 ? (
        <EmptyState
          icon={Smartphone}
          title={filtered ? "No transactions match your filters" : "No GCash transactions yet"}
          description={
            filtered
              ? "Try a different search or clear the filters."
              : "Record a cash in, cash out, or load transaction. Only the charge counts as income."
          }
          action={filtered ? <Button asChild variant="outline"><Link href="/gcash">Clear filters</Link></Button> : addButton}
        />
      ) : (
        <>
          <GcashSummary
            count={result.total}
            totalAmount={result.totalAmount}
            totalCharges={result.totalCharges}
            filtered={filtered}
          />
          <GcashTable rows={result.rows} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefForPage={(page) => `/gcash${gcashFiltersToQuery(filters, page)}`}
          />
        </>
      )}
    </div>
  );
}
