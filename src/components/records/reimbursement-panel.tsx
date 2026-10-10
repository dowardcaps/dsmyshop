import Link from "next/link";
import { Plus, PiggyBank } from "lucide-react";

import { ReimbursementForm } from "@/components/reimbursement/reimbursement-form";
import { ReimbursementTable } from "@/components/reimbursement/reimbursement-table";
import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { todayInManila } from "@/lib/dates";
import { reimbursementToFormValues, getReimbursement, listReimbursement } from "@/lib/reimbursement/queries";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { hasActiveReimbursementFilters, type ReimbursementFilters } from "@/lib/validation/reimbursement-filters";

interface ReimbursementPanelProps {
  userId: string;
  filters: ReimbursementFilters;
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function ReimbursementPanel({ userId, filters, hrefs, openNew, editId }: ReimbursementPanelProps) {
  const [result, editing] = await Promise.all([listReimbursement(userId, filters), editId ? getReimbursement(userId, editId) : null]);
  const filtered = hasActiveReimbursementFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> Add reimbursement
      </Link>
    </Button>
  );

  return (
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={filtered ? "No reimbursements match your filters" : "No reimbursements yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record money paid back to someone for a business cost. It is subtracted from net income."}
          action={filtered ? <ClearFiltersButton tab="reimbursement" /> : addButton}
        />
      ) : (
        <>
          <section aria-label={filtered ? "Summary of filtered reimbursements" : "Summary of all reimbursements"} className="grid gap-4 sm:grid-cols-2">
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Records{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{result.total.toLocaleString("en-PH")}</p>
              </CardContent>
            </Card>
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total reimbursements{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPeso(result.totalAmount)}</p>
              </CardContent>
            </Card>
          </section>
          <ReimbursementTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew ? (
        <RecordDialog title="Add reimbursement" description="Money paid back for a business cost. Subtracted from net income." closeHref={hrefs.closeHref}>
          <ReimbursementForm returnHref={hrefs.closeHref} defaultValues={{ reimbursementDate: todayInManila(), description: "", amount: Number.NaN, notes: "" }} />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title="Edit reimbursement" description="Money paid back for a business cost. Subtracted from net income." closeHref={hrefs.closeHref}>
          <ReimbursementForm defaultValues={reimbursementToFormValues(editing)} reimbursementId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
