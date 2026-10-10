/** The four record types shown on the Records page, in tab order. */
export const RECORD_TABS = ["sales", "gcash", "expenses", "debts", "excess", "salary"] as const;
export type RecordTab = (typeof RECORD_TABS)[number];

export const DEFAULT_RECORD_TAB: RecordTab = "sales";

export const RECORD_TAB_LABELS: Record<RecordTab, string> = {
  sales: "Sales",
  gcash: "GCash",
  expenses: "Expenses",
  debts: "Debts",
  excess: "Excess money",
  salary: "Salary",
};

export function parseRecordTab(value: string | string[] | undefined | null): RecordTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return RECORD_TABS.find((tab) => tab === raw) ?? DEFAULT_RECORD_TAB;
}
