"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createSaleAction, updateSaleAction } from "@/lib/actions/sales";
import { MAX_ITEMS_PER_SALE } from "@/lib/sales/constants";
import { centsToAmount, lineSubtotalCents, saleTotalCents } from "@/lib/sales/calc";
import { saleInputSchema, type SaleInput } from "@/lib/validation/sale";

interface UseSaleFormOptions {
  defaultValues: SaleInput;
  /** When set, the form edits this sale instead of creating a new one. */
  saleId?: string;
}

export function useSaleForm({ defaultValues, saleId }: UseSaleFormOptions) {
  const router = useRouter();
  const form = useForm<SaleInput>({ resolver: zodResolver(saleInputSchema), defaultValues });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });

  const subtotals = useMemo(
    () => (watchedItems ?? []).map((item) => centsToAmount(lineSubtotalCents(item))),
    [watchedItems],
  );
  const total = useMemo(() => centsToAmount(saleTotalCents(watchedItems ?? [])), [watchedItems]);

  const submit = form.handleSubmit(async (values) => {
    const result = saleId ? await updateSaleAction(saleId, values) : await createSaleAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(saleId ? "Sale updated." : "Sale saved.");
    router.push(`/sales/${result.data.id}`);
    router.refresh();
  });

  return {
    form,
    fields,
    subtotals,
    total,
    submit,
    canAddItem: fields.length < MAX_ITEMS_PER_SALE,
    canRemoveItem: fields.length > 1,
    addItem: (categoryId: string) =>
      append({ categoryId, description: "", quantity: 1, unitPrice: Number.NaN }),
    removeItem: remove,
  };
}
