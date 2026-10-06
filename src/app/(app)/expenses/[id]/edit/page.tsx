import { notFound } from "next/navigation";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { expenseToFormValues, getExpense, listExpenseCategories } from "@/lib/expenses/queries";

export const metadata = { title: "Edit expense | DS Finance" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [expense, categories] = await Promise.all([getExpense(user.id, id), listExpenseCategories(user.id)]);
  if (!expense) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit expense" description="Update this expense." />
      <ExpenseForm categories={categories} defaultValues={expenseToFormValues(expense)} expenseId={expense.id} />
    </div>
  );
}
