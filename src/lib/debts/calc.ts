import type { DebtStatusValue } from "@/lib/debts/constants";

/** Remaining balance in centavos. Never negative. */
export const debtBalanceCents = (originalCents: number, paidCents: number): number =>
  Math.max(0, originalCents - paidCents);

/** Single source of truth for a debt's status, used after every change to its payments. */
export function debtStatusFromCents(originalCents: number, paidCents: number): DebtStatusValue {
  if (paidCents <= 0) return "UNPAID";
  if (paidCents >= originalCents) return "PAID";
  return "PARTIALLY_PAID";
}

/** Percentage paid, 0..100, for progress bars. */
export function debtPercentPaid(originalCents: number, paidCents: number): number {
  if (originalCents <= 0) return 0;
  return Math.min(100, Math.round((paidCents / originalCents) * 100));
}
