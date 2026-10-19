"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { checkoutAction } from "@/lib/actions/transactions";
import { todayInManila } from "@/lib/dates";
import { formatPeso } from "@/lib/format";
import type { PaymentMethodValue, PaymentStatusValue } from "@/lib/sales/constants";

interface UseCheckoutOptions {
  items: { serviceId: string; quantity: number }[];
  /** Called after the sale is saved, to empty the cart. */
  onSaved: () => void;
}

/** Sale details typed next to the cart, and the "save this cart as a sale" call. */
export function useCheckout({ items, onSaved }: UseCheckoutOptions) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CASH");
  // Paid unless told otherwise; goes back to Paid after every save.
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusValue>("PAID");
  const [customerName, setCustomerName] = useState("");
  // null = "today", worked out when saving so a page left open past midnight still dates correctly.
  const [dateOverride, setDateOverride] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const transactionDate = dateOverride ?? todayInManila();

  /** Returns true when the sale was saved. */
  async function save(): Promise<boolean> {
    if (inFlight.current) return false;
    if (items.length === 0) {
      toast.error("The cart is empty.");
      return false;
    }
    inFlight.current = true;
    setSaving(true);
    try {
      const result = await checkoutAction({
        transactionDate: dateOverride ?? todayInManila(),
        customerName,
        paymentMethod,
        paymentStatus,
        items,
      });
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      const unpaid = paymentStatus === "UNPAID";
      toast.success(`Saved ${result.data.transactionNumber} · ${formatPeso(result.data.totalAmount)}${unpaid ? " (unpaid)" : ""}`, {
        description: unpaid
          ? "Not counted in your sales until you mark it as paid."
          : "It now shows on the Sales page.",
        action: { label: "View sales", onClick: () => router.push(unpaid ? "/records?tab=sales&status=UNPAID" : "/records?tab=sales") },
      });
      setCustomerName("");
      setPaymentStatus("PAID");
      setDateOverride(null);
      onSaved();
      return true;
    } catch {
      toast.error("Could not reach the server. Nothing was saved.");
      return false;
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return {
    paymentMethod,
    setPaymentMethod,
    paymentStatus,
    setPaymentStatus,
    customerName,
    setCustomerName,
    transactionDate,
    setTransactionDate: (value: string) => setDateOverride(value || null),
    saving,
    save,
  };
}

export type Checkout = ReturnType<typeof useCheckout>;
