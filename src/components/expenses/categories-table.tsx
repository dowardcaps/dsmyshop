"use client";

import { Pencil } from "lucide-react";

import { CategoryDialog } from "@/components/expenses/category-dialog";
import { ClientPagination } from "@/components/shared/client-pagination";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { deleteExpenseCategoryAction } from "@/lib/actions/expense-categories";
import type { ExpenseCategoryRow } from "@/lib/expenses/queries";

export function CategoriesTable({ categories }: { categories: ExpenseCategoryRow[] }) {
  const pager = usePagination(categories);

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pager.rows.map((category) => {
            const inUse = category.expenseCount > 0;
            return (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">{category.description ?? "-"}</TableCell>
                <TableCell className="text-right tabular-nums">{category.expenseCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <CategoryDialog category={category}>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${category.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                    </CategoryDialog>
                    <ConfirmDeleteButton
                      action={deleteExpenseCategoryAction.bind(null, category.id)}
                      title="Delete this category?"
                      description={`"${category.name}" will be permanently removed.`}
                      successMessage={`Deleted ${category.name}.`}
                      ariaLabel={`Delete ${category.name}`}
                      confirmLabel="Delete category"
                      iconOnly
                      disabled={inUse}
                      disabledReason={`Used by ${category.expenseCount} expense${category.expenseCount === 1 ? "" : "s"}, so it cannot be deleted`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ClientPagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.setPage} className="border-t px-4 py-3" />
    </div>
  );
}
