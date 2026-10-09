"use client";

import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSaleForm } from "@/hooks/use-sale-form";
import { formatPeso } from "@/lib/format";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/sales/constants";
import type { SaleInput } from "@/lib/validation/sale";

interface SaleFormProps {
  categories: { id: string; name: string }[];
  defaultValues: SaleInput;
  saleId?: string;
  returnHref: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function SaleForm({ categories, defaultValues, saleId, returnHref }: SaleFormProps) {
  const { form, fields, subtotals, total, submit, canAddItem, canRemoveItem, addItem, removeItem } = useSaleForm({
    defaultValues,
    saleId,
    returnHref,
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Sale details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transactionDate">Date</Label>
            <Input id="transactionDate" type="date" aria-invalid={!!errors.transactionDate} {...register("transactionDate")} />
            <FieldError message={errors.transactionDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Select id="paymentMethod" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer (optional)</Label>
            <Input id="customerName" autoComplete="off" aria-invalid={!!errors.customerName} {...register("customerName")} />
            <FieldError message={errors.customerName?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
            <FieldError message={errors.notes?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const itemErrors = errors.items?.[index];
            return (
              <div key={field.id} className="grid grid-cols-2 gap-3 rounded-lg border p-3 md:grid-cols-12">
                <div className="col-span-2 space-y-1 md:col-span-3">
                  <Label htmlFor={`items.${index}.categoryId`}>Category</Label>
                  <Select id={`items.${index}.categoryId`} aria-invalid={!!itemErrors?.categoryId} {...register(`items.${index}.categoryId`)}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={itemErrors?.categoryId?.message} />
                </div>
                <div className="col-span-2 space-y-1 md:col-span-4">
                  <Label htmlFor={`items.${index}.description`}>Description</Label>
                  <Input
                    id={`items.${index}.description`}
                    placeholder="e.g. A4 B&W Xerox"
                    autoComplete="off"
                    aria-invalid={!!itemErrors?.description}
                    {...register(`items.${index}.description`)}
                  />
                  <FieldError message={itemErrors?.description?.message} />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    aria-invalid={!!itemErrors?.quantity}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  <FieldError message={itemErrors?.quantity?.message} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor={`items.${index}.unitPrice`}>Unit price (₱)</Label>
                  <Input
                    id={`items.${index}.unitPrice`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    aria-invalid={!!itemErrors?.unitPrice}
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                  <FieldError message={itemErrors?.unitPrice?.message} />
                </div>
                <div className="col-span-2 flex items-end justify-between gap-2 md:col-span-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-sm font-semibold tabular-nums">{formatPeso(subtotals[index] ?? 0)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={!canRemoveItem}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          <FieldError message={errors.items?.root?.message ?? errors.items?.message} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => addItem(categories[0]?.id ?? "")} disabled={!canAddItem}>
              <Plus /> Add item
            </Button>
            <p className="text-right text-lg font-semibold tabular-nums">
              <span className="mr-2 text-sm font-normal text-muted-foreground">Total</span>
              {formatPeso(total)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={returnHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {saleId ? "Save changes" : "Save sale"}
        </Button>
      </div>
    </form>
  );
}
