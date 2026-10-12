"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createInventoryAction, updateInventoryAction } from "@/lib/actions/inventory";
import { inventoryInputSchema, type InventoryInput } from "@/lib/validation/inventory";

interface UseInventoryFormOptions {
  defaultValues: InventoryInput;
  /** When set, the form edits this item instead of creating a new one. */
  itemId?: string;
  /** Where to go after saving (the Inventory page, dialog closed). */
  returnHref: string;
}

export function useInventoryForm({ defaultValues, itemId, returnHref }: UseInventoryFormOptions) {
  const router = useRouter();
  const form = useForm<InventoryInput>({ resolver: zodResolver(inventoryInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = itemId ? await updateInventoryAction(itemId, values) : await createInventoryAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(itemId ? "Item updated." : "Item saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return { form, submit };
}
