import Link from "next/link";
import { Plus, Receipt, Tags } from "lucide-react";

import { ExpenseFiltersBar } from "@/components/expenses/expense-filters";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { listExpenseCategories, listExpenses } from "@/lib/expenses/queries";
import { formatPeso } from "@/lib/format";
import type { RawSearchParams } from "@/lib/validation/filter-utils";
import { expenseFiltersToQuery, hasActiveExpenseFilters, parseExpenseFilters } from "@/lib/validation/expense-filters";

export const metadata = { title: "Expenses | DS Finance" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const filters = parseExpenseFilters(await searchParams);
  const [categories, result] = await Promise.all([listExpenseCategories(user.id), listExpenses(user.id, filters)]);
  const filtered = hasActiveExpenseFilters(filters);

  const actions = (
    <>
      <Button asChild variant="outline">
        <Link href="/expenses/categories">
          <Tags /> Categories
        </Link>
      </Button>
      <Button asChild>
        <Link href="/expenses/new">
          <Plus /> Add expense
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Business expenses and categories." actions={actions} />
      <ExpenseFiltersBar filters={filters} categories={categories} />

      {result.total === 0 ? (
        <EmptyState
          icon={Receipt}
          title={filtered ? "No expenses match your filters" : "No expenses yet"}
          description={filtered ? "Try a different search or clear the filters." : "Record your first expense to start tracking costs."}
          action={
            filtered ? (
              <Button asChild variant="outline">
                <Link href="/expenses">Clear filters</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/expenses/new">
                  <Plus /> Add expense
                </Link>
              </Button>
            )
          }
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
          <ExpensesTable rows={result.rows} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefForPage={(page) => `/expenses${expenseFiltersToQuery(filters, page)}`}
          />
        </>
      )}
    </div>
  );
}
