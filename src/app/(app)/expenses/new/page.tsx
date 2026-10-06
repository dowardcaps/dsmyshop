import { redirect } from "next/navigation";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { todayInManila } from "@/lib/dates";
import { listExpenseCategories } from "@/lib/expenses/queries";

export const metadata = { title: "Add expense | DS Finance" };

export default async function NewExpensePage() {
  const user = await requireUser();
  const categories = await listExpenseCategories(user.id);
  // An expense needs a category: send the user to create one first.
  if (categories.length === 0) redirect("/expenses/categories");

  return (
    <div className="space-y-6">
      <PageHeader title="Add expense" description="Record a business cost." />
      <ExpenseForm
        categories={categories}
        defaultValues={{
          expenseDate: todayInManila(),
          categoryId: categories[0].id,
          description: "",
          amount: Number.NaN,
          notes: "",
        }}
      />
    </div>
  );
}
