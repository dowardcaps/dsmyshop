"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGcashForm } from "@/hooks/use-gcash-form";
import {
  GCASH_PROVIDERS,
  GCASH_PROVIDER_LABELS,
  GCASH_TRANSACTION_TYPES,
  GCASH_TYPE_LABELS,
} from "@/lib/gcash/constants";
import type { GcashInput } from "@/lib/validation/gcash";

interface GcashFormProps {
  defaultValues: GcashInput;
  transactionId?: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function GcashForm({ defaultValues, transactionId }: GcashFormProps) {
  const { form, submit } = useGcashForm({ defaultValues, transactionId });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transactionDate">Date</Label>
            <Input id="transactionDate" type="date" aria-invalid={!!errors.transactionDate} {...register("transactionDate")} />
            <FieldError message={errors.transactionDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionType">Type</Label>
            <Select id="transactionType" {...register("transactionType")}>
              {GCASH_TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {GCASH_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select id="provider" {...register("provider")}>
              {GCASH_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {GCASH_PROVIDER_LABELS[provider]}
                </option>
              ))}
            </Select>
          </div>
          <div className="hidden sm:block" />
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.amount}
              aria-describedby="amount-help"
              {...register("amount", { valueAsNumber: true })}
            />
            <p id="amount-help" className="text-xs text-muted-foreground">
              The money moved. This is not counted as income.
            </p>
            <FieldError message={errors.amount?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="charge">Charge (₱)</Label>
            <Input
              id="charge"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.charge}
              aria-describedby="charge-help"
              {...register("charge", { valueAsNumber: true })}
            />
            <p id="charge-help" className="text-xs text-muted-foreground">
              Your fee. This is the part counted as income.
            </p>
            <FieldError message={errors.charge?.message} />
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
          <Link href="/gcash">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {transactionId ? "Save changes" : "Save transaction"}
        </Button>
      </div>
    </form>
  );
}
