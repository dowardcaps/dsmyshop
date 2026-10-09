import { TABLE_PAGE_SIZE } from "@/lib/pagination";

export const DEBT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"] as const;
export type DebtStatusValue = (typeof DEBT_STATUSES)[number];

export const DEBT_STATUS_LABELS: Record<DebtStatusValue, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
};

export const DEBTS_PAGE_SIZE = TABLE_PAGE_SIZE;
