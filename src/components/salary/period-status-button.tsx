"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markPeriodPaidAction, markPeriodUnpaidAction } from "@/lib/actions/salary";

interface PeriodStatusButtonProps {
  periodId: string;
  paid: boolean;
  /** For the accessible name, e.g. "Doward, Oct 15, 2026". */
  label: string;
}

/** Marks a pay date as paid out (or undoes it). Paid pay dates are locked against advance changes. */
export function PeriodStatusButton({ periodId, paid, label }: PeriodStatusButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = paid ? await markPeriodUnpaidAction(periodId) : await markPeriodPaidAction(periodId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(paid ? "Marked as unpaid." : "Marked as paid.");
      router.refresh();
    });

  return (
    <Button type="button" variant={paid ? "ghost" : "outline"} size="sm" disabled={pending} onClick={run} aria-label={`${paid ? "Mark unpaid" : "Mark paid"}: ${label}`}>
      {pending ? <Loader2 className="animate-spin" /> : paid ? <Undo2 /> : <Check />}
      {paid ? "Undo" : "Mark paid"}
    </Button>
  );
}
