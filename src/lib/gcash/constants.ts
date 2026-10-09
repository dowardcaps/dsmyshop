import { TABLE_PAGE_SIZE } from "@/lib/pagination";

export const GCASH_TRANSACTION_TYPES = ["CASH_IN", "CASH_OUT", "LOAD"] as const;
export type GcashTransactionTypeValue = (typeof GCASH_TRANSACTION_TYPES)[number];

export const GCASH_TYPE_LABELS: Record<GcashTransactionTypeValue, string> = {
  CASH_IN: "Cash In",
  CASH_OUT: "Cash Out",
  LOAD: "Load",
};

export const GCASH_PROVIDERS = ["GCASH", "DITO", "TNT", "SMART", "GLOBE", "TM", "OTHER"] as const;
export type GcashProviderValue = (typeof GCASH_PROVIDERS)[number];

export const GCASH_PROVIDER_LABELS: Record<GcashProviderValue, string> = {
  GCASH: "GCash",
  DITO: "DITO",
  TNT: "TNT",
  SMART: "Smart",
  GLOBE: "Globe",
  TM: "TM",
  OTHER: "Other",
};

export const GCASH_PAGE_SIZE = TABLE_PAGE_SIZE;
