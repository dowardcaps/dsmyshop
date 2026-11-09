/** Starting values, created once for a new user and then fully editable. Nothing in the formulas reads these. */
export const DEFAULT_SETTINGS = {
  operatingDays: 26,
  minDailyTarget: 600,
  dailyTarget: 1000,
  growthTarget: 1500,
} as const;

/** Monthly fixed costs seeded on first visit. Salaries are not here: they come from the Salary tab. */
export const DEFAULT_FIXED_EXPENSES = [
  { name: "Rent and Electricity", amount: 2900 },
  { name: "Internet", amount: 800 },
  { name: "Transaction Expenses", amount: 1600 },
] as const;

export const EXPENSE_KINDS = ["VARIABLE", "MATERIAL", "FIXED"] as const;
export type ExpenseKindValue = (typeof EXPENSE_KINDS)[number];
export const EXPENSE_KIND_LABELS: Record<ExpenseKindValue, string> = {
  VARIABLE: "Other expense (daily cost)",
  MATERIAL: "Material cost (consumables)",
  FIXED: "Fixed cost (already in monthly fixed costs)",
};

export const PERFORMANCE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Details" },
  { id: "daily", label: "Daily" },
  { id: "breakeven", label: "Break-even" },
  { id: "settings", label: "Settings" },
] as const;
export type PerformanceTab = (typeof PERFORMANCE_TABS)[number]["id"];
