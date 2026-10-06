"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebtForm } from "@/hooks/use-debt-form";
import type { DebtInput } from "@/lib/validation/debt";

interface DebtFormProps {
  defaultValues: DebtInput;
  debtId?: string;
  cancelHref: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function DebtForm({ defaultValues, debtId, cancelHref }: DebtFormProps) {
  const { form, submit } = useDebtForm({ defaultValues, debtId });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="off" placeholder="e.g. Supplier, loan, or person owed" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="originalAmount">Original amount (₱)</Label>
            <Input
              id="originalAmount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.originalAmount}
              {...register("originalAmount", { valueAsNumber: true })}
            />
            <FieldError message={errors.originalAmount?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debtDate">Date</Label>
            <Input id="debtDate" type="date" aria-invalid={!!errors.debtDate} {...register("debtDate")} />
            <FieldError message={errors.debtDate?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={2} aria-invalid={!!errors.description} {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {debtId ? "Save changes" : "Save debt"}
        </Button>
      </div>
    </form>
  );
}
