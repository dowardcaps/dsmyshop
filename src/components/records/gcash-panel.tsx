import Link from "next/link";
import { Plus, Smartphone } from "lucide-react";

import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { GcashForm } from "@/components/gcash/gcash-form";
import { GcashSummary } from "@/components/gcash/gcash-summary";
import { GcashTable } from "@/components/gcash/gcash-table";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { todayInManila } from "@/lib/dates";
import { gcashToFormValues, getGcashTransaction, listGcashTransactions } from "@/lib/gcash/queries";
import type { RecordHrefs } from "@/lib/records/href";
import { hasActiveGcashFilters, type GcashFilters } from "@/lib/validation/gcash-filters";

interface GcashPanelProps {
  userId: string;
  filters: GcashFilters;
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function GcashPanel({ userId, filters, hrefs, openNew, editId }: GcashPanelProps) {
  const [result, editing] = await Promise.all([listGcashTransactions(userId, filters), editId ? getGcashTransaction(userId, editId) : null]);
  const filtered = hasActiveGcashFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> Add transaction
      </Link>
    </Button>
  );

  return (
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={Smartphone}
          title={filtered ? "No transactions match your filters" : "No GCash transactions yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record a cash in, cash out, or load transaction. Only the charge counts as income."}
          action={filtered ? <ClearFiltersButton tab="gcash" /> : addButton}
        />
      ) : (
        <>
          <GcashSummary count={result.total} totalAmount={result.totalAmount} totalCharges={result.totalCharges} filtered={filtered} />
          <GcashTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew ? (
        <RecordDialog title="Add transaction" description="Amount and charge are stored separately." closeHref={hrefs.closeHref}>
          <GcashForm
            returnHref={hrefs.closeHref}
            defaultValues={{ transactionDate: todayInManila(), transactionType: "CASH_IN", provider: "GCASH", amount: Number.NaN, charge: Number.NaN, notes: "" }}
          />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title="Edit transaction" description="Amount and charge are stored separately." closeHref={hrefs.closeHref}>
          <GcashForm defaultValues={gcashToFormValues(editing)} transactionId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
