import Link from "next/link";
import { Plus, PiggyBank } from "lucide-react";

import { ExcessForm } from "@/components/excess/excess-form";
import { ExcessTable } from "@/components/excess/excess-table";
import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { todayInManila } from "@/lib/dates";
import { excessToFormValues, getExcess, listExcess } from "@/lib/excess/queries";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { hasActiveExcessFilters, type ExcessFilters } from "@/lib/validation/excess-filters";

interface ExcessPanelProps {
  userId: string;
  filters: ExcessFilters;
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function ExcessPanel({ userId, filters, hrefs, openNew, editId }: ExcessPanelProps) {
  const [result, editing] = await Promise.all([listExcess(userId, filters), editId ? getExcess(userId, editId) : null]);
  const filtered = hasActiveExcessFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> Add excess money
      </Link>
    </Button>
  );

  return (
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={filtered ? "No records match your filters" : "No excess money yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record extra cash found versus your records. It is kept apart from sales income."}
          action={filtered ? <ClearFiltersButton tab="excess" /> : addButton}
        />
      ) : (
        <>
          <section aria-label={filtered ? "Summary of filtered excess money" : "Summary of all excess money"} className="grid gap-4 sm:grid-cols-2">
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Records{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{result.total.toLocaleString("en-PH")}</p>
              </CardContent>
            </Card>
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total excess money{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPeso(result.totalAmount)}</p>
              </CardContent>
            </Card>
          </section>
          <ExcessTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew ? (
        <RecordDialog title="Add excess money" description="Extra cash found versus your records." closeHref={hrefs.closeHref}>
          <ExcessForm returnHref={hrefs.closeHref} defaultValues={{ excessDate: todayInManila(), amount: Number.NaN, notes: "" }} />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title="Edit excess money" description="Extra cash found versus your records." closeHref={hrefs.closeHref}>
          <ExcessForm defaultValues={excessToFormValues(editing)} excessId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
