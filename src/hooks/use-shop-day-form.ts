"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { clearShopDaysAction, setShopDaysAction } from "@/lib/actions/calendar";
import {
  shopDayInputSchema,
  type ShopDayInput,
} from "@/lib/validation/calendar";

export function useShopDayForm({
  defaultValues,
  returnHref,
}: {
  defaultValues: ShopDayInput;
  returnHref: string;
}) {
  const router = useRouter();
  const form = useForm<ShopDayInput>({
    resolver: zodResolver(shopDayInputSchema),
    defaultValues,
  });

  function done(message: string) {
    toast.success(message);
    router.replace(returnHref, { scroll: false });
    router.refresh();
  }

  const submit = form.handleSubmit(async (values) => {
    const result = await setShopDaysAction(values);
    if (!result.ok) return void toast.error(result.error);
    done(
      result.data.days === 1 ? "Day saved." : `${result.data.days} days saved.`,
    );
  });

  async function clear() {
    const { fromDate, toDate } = form.getValues();
    const result = await clearShopDaysAction({ fromDate, toDate });
    if (!result.ok) return void toast.error(result.error);
    done("Cleared. Those days are back to their default.");
  }

  return { form, submit, clear };
}
