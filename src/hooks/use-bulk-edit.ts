"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { bulkEditServicesAction } from "@/lib/actions/transactions";
import { toCents } from "@/lib/cents";
import { applyPriceChange, toPriceChange, type PriceAction } from "@/lib/transactions/bulk";
import { bulkEditSchema } from "@/lib/validation/transaction";

interface BulkTarget {
  id: string;
  name: string;
  price: number;
}

interface UseBulkEditOptions {
  targets: BulkTarget[];
  onDone: () => void;
}

/** Form state, live preview and submit for the "Edit selected services" dialog. */
export function useBulkEdit({ targets, onDone }: UseBulkEditOptions) {
  const [priceAction, setPriceAction] = useState<PriceAction>("keep");
  const [priceValue, setPriceValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const change = useMemo(() => toPriceChange(priceAction, priceValue === "" ? Number.NaN : Number(priceValue)), [priceAction, priceValue]);

  const preview = useMemo(
    () =>
      targets.map((target) => {
        const cents = change ? applyPriceChange(toCents(target.price), change) : toCents(target.price);
        return { ...target, newPrice: cents === null ? null : cents / 100 };
      }),
    [targets, change],
  );
  const invalidCount = preview.filter((row) => row.newPrice === null).length;

  const wantsPrice = priceAction !== "keep";
  const priceMissing = wantsPrice && change === null;
  const nothingToDo = !wantsPrice && !categoryId;
  const canSave = !saving && !nothingToDo && !priceMissing && invalidCount === 0 && targets.length > 0;

  async function save() {
    if (!canSave) return;
    const payload = {
      ids: targets.map((target) => target.id),
      ...(change ? { priceChange: change } : {}),
      ...(categoryId ? { categoryId } : {}),
    };
    const parsed = bulkEditSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the changes.");
      return;
    }
    setSaving(true);
    try {
      const result = await bulkEditServicesAction(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Updated ${result.data.count} ${result.data.count === 1 ? "service" : "services"}.`);
      onDone();
    } catch {
      toast.error("Could not reach the server. Nothing was changed.");
    } finally {
      setSaving(false);
    }
  }

  return { priceAction, setPriceAction, priceValue, setPriceValue, categoryId, setCategoryId, preview, invalidCount, canSave, saving, wantsPrice, save };
}
