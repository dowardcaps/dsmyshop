import Link from "next/link";
import { Plus, Wallet } from "lucide-react";

import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { AdvanceForm } from "@/components/salary/advance-form";
import { AdvancesTable } from "@/components/salary/advances-table";
import { SalaryPeriodsTable } from "@/components/salary/salary-periods-table";
import { SalarySummary } from "@/components/salary/salary-summary";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { todayInManila } from "@/lib/dates";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { advanceToFormValues, getSalaryAdvance, listAdvanceOptions, listSalaryAdvances, listSalaryPeriods } from "@/lib/salary/queries";
import { hasActiveSalaryFilters, type SalaryFilters } from "@/lib/validation/salary-filters";

interface SalaryPanelProps {
  userId: string;
  filters: SalaryFilters;
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function SalaryPanel({ userId, filters, hrefs, openNew, editId }: SalaryPanelProps) {
  const [periods, advances, editing, options] = await Promise.all([
    listSalaryPeriods(userId, filters),
    listSalaryAdvances(userId, filters),
    editId ? getSalaryAdvance(userId, editId) : null,
    openNew || editId ? listAdvanceOptions(userId, editId) : null,
  ]);
  const filtered = hasActiveSalaryFilters(filters);

  return (
    <>
      {periods.total === 0 ? (
        <EmptyState
          icon={Wallet}
          title={filtered ? "No salary records match your filters" : "No pay dates yet"}
          description={filtered ? "Try a different search or clear the filters." : "Pay dates for each employee appear here automatically (the 15th and the 30th)."}
          action={filtered ? <ClearFiltersButton tab="salary" /> : undefined}
        />
      ) : (
        <>
          <SalarySummary result={periods} filtered={filtered} />
          <SalaryPeriodsTable rows={periods.rows} />
          <Pagination page={periods.page} pageCount={periods.pageCount} total={periods.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
        <div>
          <h2 className="text-base font-semibold">Cash advances</h2>
          <p className="text-sm text-muted-foreground">
            {advances.total} {advances.total === 1 ? "advance" : "advances"} · {formatPeso(advances.totalCents / 100)} total{filtered ? " (filtered)" : ""}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={hrefs.addHref} scroll={false}>
            <Plus /> Add cash advance
          </Link>
        </Button>
      </div>
      {advances.total === 0 ? (
        <EmptyState icon={Wallet} title="No cash advances" description="When an employee asks for a cash advance or salary advance, add it here. It is deducted from the 15th or 30th salary." />
      ) : (
        <>
          <AdvancesTable rows={advances.rows} editHref={hrefs.editHref} />
          <Pagination page={advances.page} pageCount={advances.pageCount} total={advances.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHrefFor("apage")} />
        </>
      )}

      {openNew && options && options.employees.length > 0 ? (
        <RecordDialog title="Add cash advance" description="The amount is deducted from the salary on the pay date you choose." closeHref={hrefs.closeHref}>
          <AdvanceForm
            employees={options.employees}
            periods={options.periods}
            returnHref={hrefs.closeHref}
            defaultValues={{
              employeeId: options.employees[0].id,
              periodId: options.periods.find((p) => p.employeeId === options.employees[0].id)?.id ?? "",
              advanceDate: todayInManila(),
              amount: Number.NaN,
              notes: "",
            }}
          />
        </RecordDialog>
      ) : null}

      {editing && !editing.periodPaid && options ? (
        <RecordDialog title="Edit cash advance" description={`${editing.employeeName}. The salary balance is recalculated when you save.`} closeHref={hrefs.closeHref}>
          <AdvanceForm employees={options.employees} periods={options.periods} defaultValues={advanceToFormValues(editing)} advanceId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
