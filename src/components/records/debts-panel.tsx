import Link from "next/link";
import { HandCoins, Plus } from "lucide-react";

import { DebtForm } from "@/components/debts/debt-form";
import { DebtsTable } from "@/components/debts/debts-table";
import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { debtToFormValues, getDebt, listDebts } from "@/lib/debts/queries";
import { todayInManila } from "@/lib/dates";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { hasActiveDebtFilters, type DebtFilters } from "@/lib/validation/debt-filters";

interface DebtsPanelProps {
  userId: string;
  filters: DebtFilters;
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function DebtsPanel({ userId, filters, hrefs, openNew, editId }: DebtsPanelProps) {
  const [result, editing] = await Promise.all([listDebts(userId, filters), editId ? getDebt(userId, editId) : null]);
  const filtered = hasActiveDebtFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
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
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={filtered ? "No debts match your filters" : "No debts yet"}
          description={filtered ? "Try a different search or clear the filters." : "Add a debt to track payments and the remaining balance."}
          action={filtered ? <ClearFiltersButton tab="debts" /> : addButton}
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
          <DebtsTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew ? (
        <RecordDialog title="Add debt" description="Record money you owe. Payments are added afterwards." closeHref={hrefs.closeHref}>
          <DebtForm returnHref={hrefs.closeHref} defaultValues={{ name: "", description: "", originalAmount: Number.NaN, debtDate: todayInManila() }} />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title={`Edit ${editing.name}`} description="The amount cannot be lower than what has already been paid." closeHref={hrefs.closeHref}>
          <DebtForm defaultValues={debtToFormValues(editing)} debtId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
