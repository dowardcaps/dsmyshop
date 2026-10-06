import Link from "next/link";
import { ArrowLeft, Plus, Tags } from "lucide-react";

import { CategoriesTable } from "@/components/expenses/categories-table";
import { CategoryDialog } from "@/components/expenses/category-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { listExpenseCategoriesWithUsage } from "@/lib/expenses/queries";

export const metadata = { title: "Expense categories | DS Finance" };

export default async function ExpenseCategoriesPage() {
  const user = await requireUser();
  const categories = await listExpenseCategoriesWithUsage(user.id);

  const addButton = (
    <CategoryDialog>
      <Button>
        <Plus /> Add category
      </Button>
    </CategoryDialog>
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/expenses">
          <ArrowLeft /> Back to expenses
        </Link>
      </Button>
      <PageHeader
        title="Expense categories"
        description="Categories that are used by expenses can be renamed but not deleted."
        actions={addButton}
      />
      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Add a category before recording expenses."
          action={addButton}
        />
      ) : (
        <CategoriesTable categories={categories} />
      )}
    </div>
  );
}
