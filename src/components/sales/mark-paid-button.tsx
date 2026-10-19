"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setSalePaidAction } from "@/lib/actions/sales";

/** One click: the customer paid, so the sale now counts in your sales. */
export function MarkPaidButton({ saleId, label, withText = false }: { saleId: string; label: string; withText?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markPaid() {
    startTransition(async () => {
      const result = await setSalePaidAction(saleId, true);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${label} is now paid and counted in your sales.`);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={withText ? "default" : "ghost"}
      size={withText ? "default" : "icon"}
      onClick={markPaid}
      disabled={pending}
      aria-label={`Mark ${label} as paid`}
      title="Mark as paid"
      className={withText ? undefined : "text-emerald-600 hover:text-emerald-700"}
    >
      {pending ? <Loader2 className="animate-spin" /> : <CircleCheck className={withText ? undefined : "size-4"} />}
      {withText ? "Mark as paid" : null}
    </Button>
  );
}
