import Link from "next/link";
import { Plus, Tags } from "lucide-react";

import { DebtsPanel } from "@/components/records/debts-panel";
import { ExcessPanel } from "@/components/records/excess-panel";
import { ExpensesPanel } from "@/components/records/expenses-panel";
import { GcashPanel } from "@/components/records/gcash-panel";
import { PageHeader } from "@/components/layout/page-header";
import { RecordsFilterBar } from "@/components/records/records-filter-bar";
import { RecordsTabs } from "@/components/records/records-tabs";
import { SalesPanel } from "@/components/records/sales-panel";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { listExpenseCategories } from "@/lib/expenses/queries";
import { createRecordHrefs } from "@/lib/records/href";
import { parseRecordTab, type RecordTab } from "@/lib/records/tabs";
import { debtFilterValues, excessFilterValues, expenseFilterValues, gcashFilterValues, saleFilterValues } from "@/lib/records/values";
import { listSaleCategories } from "@/lib/sales/queries";
import { parseExcessFilters } from "@/lib/validation/excess-filters";
import { parseDebtFilters } from "@/lib/validation/debt-filters";
import { parseExpenseFilters } from "@/lib/validation/expense-filters";
import { parseGcashFilters } from "@/lib/validation/gcash-filters";
import type { RawSearchParams } from "@/lib/validation/filter-utils";
import { firstParam } from "@/lib/validation/filter-utils";
import { parseSaleFilters } from "@/lib/validation/sale-filters";

export const metadata = { title: "Records | DS Finance" };

const ADD_LABEL: Record<RecordTab, string> = {
  sales: "New sale",
  gcash: "Add transaction",
  expenses: "Add expense",
  debts: "Add debt",
  excess: "Add excess money",
};

export default async function RecordsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const params = await searchParams;
  const tab = parseRecordTab(params.tab);
  const hrefs = createRecordHrefs(tab, params);
  const openNew = firstParam(params.new) === "1";
  const editId = firstParam(params.edit);

  const actions = (
    <>
      {tab === "expenses" ? (
        <Button asChild variant="outline">
          <Link href="/expenses/categories">
            <Tags /> Categories
          </Link>
        </Button>
      ) : null}
      <Button asChild>
        <Link href={hrefs.addHref} scroll={false}>
          <Plus /> {ADD_LABEL[tab]}
        </Link>
      </Button>
    </>
  );

  let bar: React.ReactNode;
  let panel: React.ReactNode;

  if (tab === "sales") {
    const filters = parseSaleFilters(params);
    const categories = await listSaleCategories(user.id);
    const values = saleFilterValues(filters);
    bar = <RecordsFilterBar key={JSON.stringify(values)} tab={tab} values={values} categories={categories.map((c) => ({ value: c.id, label: c.name }))} />;
    panel = <SalesPanel userId={user.id} filters={filters} categories={categories} hrefs={hrefs} openNew={openNew} editId={editId} />;
  } else if (tab === "gcash") {
    const filters = parseGcashFilters(params);
    const values = gcashFilterValues(filters);
    bar = <RecordsFilterBar key={JSON.stringify(values)} tab={tab} values={values} categories={[]} />;
    panel = <GcashPanel userId={user.id} filters={filters} hrefs={hrefs} openNew={openNew} editId={editId} />;
  } else if (tab === "expenses") {
    const filters = parseExpenseFilters(params);
    const categories = await listExpenseCategories(user.id);
    const values = expenseFilterValues(filters);
    bar = <RecordsFilterBar key={JSON.stringify(values)} tab={tab} values={values} categories={categories.map((c) => ({ value: c.id, label: c.name }))} />;
    panel = <ExpensesPanel userId={user.id} filters={filters} categories={categories} hrefs={hrefs} openNew={openNew} editId={editId} />;
  } else if (tab === "excess") {
    const filters = parseExcessFilters(params);
    const values = excessFilterValues(filters);
    bar = <RecordsFilterBar key={JSON.stringify(values)} tab={tab} values={values} categories={[]} />;
    panel = <ExcessPanel userId={user.id} filters={filters} hrefs={hrefs} openNew={openNew} editId={editId} />;
  } else {
    const filters = parseDebtFilters(params);
    const values = debtFilterValues(filters);
    bar = <RecordsFilterBar key={JSON.stringify(values)} tab={tab} values={values} categories={[]} />;
    panel = <DebtsPanel userId={user.id} filters={filters} hrefs={hrefs} openNew={openNew} editId={editId} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Records" description="Sales, GCash, expenses, debts and excess money. One set of filters for all of them." actions={actions} />
      {bar}
      <RecordsTabs active={tab} />
      {panel}
    </div>
  );
}
