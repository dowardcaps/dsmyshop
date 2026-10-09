"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useExpenseForm } from "@/hooks/use-expense-form";
import type { ExpenseInput } from "@/lib/validation/expense";

interface ExpenseFormProps {
  categories: { id: string; name: string }[];
  defaultValues: ExpenseInput;
  expenseId?: string;
  returnHref: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function ExpenseForm({ categories, defaultValues, expenseId, returnHref }: ExpenseFormProps) {
  const { form, submit } = useExpenseForm({ defaultValues, expenseId, returnHref });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="expenseDate">Date</Label>
            <Input id="expenseDate" type="date" aria-invalid={!!errors.expenseDate} {...register("expenseDate")} />
            <FieldError message={errors.expenseDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select id="categoryId" aria-invalid={!!errors.categoryId} {...register("categoryId")}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.categoryId?.message} />
            <p className="text-xs text-muted-foreground">
              Need another one? <Link href="/expenses/categories" className="underline underline-offset-4">Manage categories</Link>
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" autoComplete="off" placeholder="e.g. Ink refill" aria-invalid={!!errors.description} {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.amount}
              {...register("amount", { valueAsNumber: true })}
            />
            <FieldError message={errors.amount?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
            <FieldError message={errors.notes?.message} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={returnHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {expenseId ? "Save changes" : "Save expense"}
        </Button>
      </div>
    </form>
  );
}
