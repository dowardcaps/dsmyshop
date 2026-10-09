import Link from "next/link";
import { Plus, Receipt } from "lucide-react";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { todayInManila } from "@/lib/dates";
import { expenseToFormValues, getExpense, listExpenses } from "@/lib/expenses/queries";
import { formatPeso } from "@/lib/format";
import type { RecordHrefs } from "@/lib/records/href";
import { hasActiveExpenseFilters, type ExpenseFilters } from "@/lib/validation/expense-filters";

interface ExpensesPanelProps {
  userId: string;
  filters: ExpenseFilters;
  categories: { id: string; name: string }[];
  hrefs: RecordHrefs;
  openNew: boolean;
  editId?: string;
}

export async function ExpensesPanel({ userId, filters, categories, hrefs, openNew, editId }: ExpensesPanelProps) {
  const [result, editing] = await Promise.all([listExpenses(userId, filters), editId ? getExpense(userId, editId) : null]);
  const filtered = hasActiveExpenseFilters(filters);

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> Add expense
      </Link>
    </Button>
  );

  return (
    <>
      {result.total === 0 ? (
        <EmptyState
          icon={Receipt}
          title={filtered ? "No expenses match your filters" : "No expenses yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record your first expense to start tracking costs."}
          action={filtered ? <ClearFiltersButton tab="expenses" /> : addButton}
        />
      ) : (
        <>
          <section aria-label={filtered ? "Summary of filtered expenses" : "Summary of all expenses"} className="grid gap-4 sm:grid-cols-2">
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Expenses{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{result.total.toLocaleString("en-PH")}</p>
              </CardContent>
            </Card>
            <Card className="gap-1 py-4">
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total expenses{filtered ? " (filtered)" : ""}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPeso(result.totalAmount)}</p>
              </CardContent>
            </Card>
          </section>
          <ExpensesTable rows={result.rows} editHref={hrefs.editHref} />
          <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
        </>
      )}

      {openNew && categories.length > 0 ? (
        <RecordDialog title="Add expense" description="Record a business cost." closeHref={hrefs.closeHref}>
          <ExpenseForm
            categories={categories}
            returnHref={hrefs.closeHref}
            defaultValues={{ expenseDate: todayInManila(), categoryId: categories[0].id, description: "", amount: Number.NaN, notes: "" }}
          />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title="Edit expense" description="Update this expense." closeHref={hrefs.closeHref}>
          <ExpenseForm categories={categories} defaultValues={expenseToFormValues(editing)} expenseId={editing.id} returnHref={hrefs.closeHref} />
        </RecordDialog>
      ) : null}
    </>
  );
}
