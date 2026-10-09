/**
 * Bulk price changes, in integer centavos. Shared by the dialog's live preview and by the server,
 * so what you preview is exactly what gets saved.
 */

import { MAX_MONEY } from "@/lib/validation/shared";

export const MAX_BULK_SERVICES = 500;

/** "set": new price. "percent": signed % change. "amount": signed peso change. */
export interface PriceChange {
  mode: "set" | "percent" | "amount";
  value: number;
}

const MIN_CENTS = 1;
const MAX_CENTS = Math.round(MAX_MONEY * 100);

/** The new price in centavos, or null when it would be below ₱0.01, above the limit, or not a number. */
export function applyPriceChange(priceCents: number, change: PriceChange): number | null {
  if (!Number.isFinite(change.value)) return null;
  let next: number;
  if (change.mode === "set") {
    next = Math.round(change.value * 100);
  } else if (change.mode === "amount") {
    next = priceCents + Math.round(change.value * 100);
  } else {
    // Basis points keep the math in whole numbers: +7.5% is 10750 / 10000.
    next = Math.round((priceCents * (10_000 + Math.round(change.value * 100))) / 10_000);
  }
  return next >= MIN_CENTS && next <= MAX_CENTS ? next : null;
}

export const PRICE_ACTIONS = [
  { value: "keep", label: "Don't change" },
  { value: "set", label: "Set price to (₱)" },
  { value: "increase_percent", label: "Increase by (%)" },
  { value: "decrease_percent", label: "Decrease by (%)" },
  { value: "increase_amount", label: "Increase by (₱)" },
  { value: "decrease_amount", label: "Decrease by (₱)" },
] as const;

export type PriceAction = (typeof PRICE_ACTIONS)[number]["value"];

/** Turns the form's action + typed number into a PriceChange. Null when there is nothing to apply. */
export function toPriceChange(action: PriceAction, value: number): PriceChange | null {
  if (action === "keep" || !Number.isFinite(value)) return null;
  const magnitude = Math.abs(value);
  switch (action) {
    case "set":
      return { mode: "set", value: magnitude };
    case "increase_percent":
      return { mode: "percent", value: magnitude };
    case "decrease_percent":
      return { mode: "percent", value: -magnitude };
    case "increase_amount":
      return { mode: "amount", value: magnitude };
    case "decrease_amount":
      return { mode: "amount", value: -magnitude };
  }
}
