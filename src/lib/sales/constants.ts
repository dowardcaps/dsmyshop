import { TABLE_PAGE_SIZE } from "@/lib/pagination";

export const PAYMENT_METHODS = ["CASH", "GCASH", "BANK_TRANSFER", "OTHER"] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

export const PAYMENT_STATUSES = ["PAID", "UNPAID"] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusValue, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
};

export const SALES_PAGE_SIZE = TABLE_PAGE_SIZE;
export const MAX_ITEMS_PER_SALE = 50;
