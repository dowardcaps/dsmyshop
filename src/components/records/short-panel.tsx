import Link from "next/link";
import { Plus, PiggyBank } from "lucide-react";

import { ShortForm } from "@/components/short/short-form";
import { ShortTable } from "@/components/short/short-table";
import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { todayInManila } from "@/lib/dates";
import { shortToFormValues, getShort, listShort } from "@/lib/short/queries";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { hasActiveShortFilters, type ShortFilters } from "@/lib/validation/short-filters";

interface ShortPanelProps {
  userId: string;
  filters: ShortFilters;
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function ShortPanel({ userId, filters, hrefs, openNew, editId }: ShortPanelProps) {
  const [result, editing] = await Promise.all([listShort(userId, filters), editId ? getShort(userId, editId) : null]);
  const filtered = hasActiveShortFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> Add short
      </Link>
    </Button>
  );

  return (
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={filtered ? "No records match your filters" : "No short records yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record cash that is missing versus your records. It is subtracted from net income."}
          action={filtered ? <ClearFiltersButton tab="short" /> : addButton}
        />
      ) : (
        <>
          <section aria-label={filtered ? "Summary of filtered short records" : "Summary of all short records"} className="grid gap-4 sm:grid-cols-2">
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Records{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{result.total.toLocaleString("en-PH")}</p>
              </CardContent>
            </Card>
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total short{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPeso(result.totalAmount)}</p>
              </CardContent>
            </Card>
          </section>
          <ShortTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew ? (
        <RecordDialog title="Add short" description="Cash missing versus your records. Subtracted from net income." closeHref={hrefs.closeHref}>
          <ShortForm returnHref={hrefs.closeHref} defaultValues={{ shortDate: todayInManila(), amount: Number.NaN, notes: "" }} />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title="Edit short record" description="Cash missing versus your records. Subtracted from net income." closeHref={hrefs.closeHref}>
          <ShortForm defaultValues={shortToFormValues(editing)} shortId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
