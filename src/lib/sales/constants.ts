export const PAYMENT_METHODS = ["CASH", "GCASH", "BANK_TRANSFER", "OTHER"] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

export const SALES_PAGE_SIZE = 20;
export const MAX_ITEMS_PER_SALE = 50;
