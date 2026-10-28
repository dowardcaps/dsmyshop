import type { DashboardData } from "@/lib/dashboard/queries";

/** One line of the money overview. `id` doubles as the test id of its value. */
export interface OverviewRow {
  id: string;
  label: string;
  /** Plain-words explanation shown under the label. */
  hint?: string;
  cents: number;
  href?: string;
}

export type Tone = "positive" | "negative" | "neutral";

export interface MoneyOverview {
  /** The four headline numbers: what came in, what went out, what was kept, and the running total so far. */
  headline: {
    id: string;
    label: string;
    hint: string;
    cents: number;
    tone: Tone;
  }[];
  moneyIn: OverviewRow[];
  moneyOut: OverviewRow[];
  /** "Earlier months + this month = total so far", like TOTAL NET INCOME in Sales.xlsx. */
  running: {
    broughtForward: OverviewRow;
    thisMonth: OverviewRow;
    total: OverviewRow;
  };
  debt: OverviewRow & { openCount: number };
  /** GCash money handled for customers. Never income, so it lives apart from the totals. */
  gcashMoved: { label: string; cents: number }[];
}

const toneOf = (cents: number): Tone =>
  cents < 0 ? "negative" : cents > 0 ? "positive" : "neutral";

/** Turns the accountant-style numbers into plain "money in / money out / kept" groups. Pure. */
export function buildMoneyOverview(
  data: DashboardData,
  periodText: string,
): MoneyOverview {
  const { summary, cashMovements } = data;
  const moneyIn = summary.revenueCents + summary.excessCents;
  const moneyOut = summary.totalDeductionsCents;

  return {
    headline: [
      {
        id: "money-in",
        label: "Money in",
        hint: "Sales, GCash fees and excess money",
        cents: moneyIn,
        tone: "neutral",
      },
      {
        id: "money-out",
        label: "Money out",
        hint: "Expenses, reimbursements, salaries and short",
        cents: moneyOut,
        tone: "neutral",
      },
      {
        id: "net-income",
        label: `Profit for ${periodText}`,
        hint: "Money in minus money out",
        cents: summary.netIncomeCents,
        tone: toneOf(summary.netIncomeCents),
      },
      {
        id: "total-profit",
        label: "Total profit so far",
        hint: "Earlier months plus this one",
        cents: summary.totalNetIncomeCents,
        tone: toneOf(summary.totalNetIncomeCents),
      },
    ],
    moneyIn: [
      {
        id: "total-sales",
        label: "Sales",
        hint: `${data.counts.sales} sale${data.counts.sales === 1 ? "" : "s"}`,
        cents: summary.salesCents,
      },
      {
        id: "gcash-charges",
        label: "GCash fees earned",
        hint: "Only the fee counts, not the cash moved",
        cents: summary.gcashChargesCents,
      },
      {
        id: "excess-money",
        label: "Excess money",
        hint: "Extra cash found",
        cents: summary.excessCents,
        href: "/records?tab=excess",
      },
    ],
    moneyOut: [
      {
        id: "total-expenses",
        label: "Expenses",
        hint: `${data.counts.expenses} expense${data.counts.expenses === 1 ? "" : "s"}`,
        cents: summary.expensesCents,
      },
      {
        id: "reimbursements",
        label: "Reimbursements",
        hint: "Paid back for business costs",
        cents: summary.reimbursementsCents,
        href: "/records?tab=reimbursement",
      },
      {
        id: "salary-paid",
        label: "Salaries paid",
        hint: "Cash handed to employees, advances included",
        cents: summary.salaryPaidCents,
        href: "/records?tab=salary",
      },
      {
        id: "short",
        label: "Short",
        hint: "Missing cash",
        cents: summary.shortCents,
        href: "/records?tab=short",
      },
    ],
    running: {
      broughtForward: {
        id: "brought-forward",
        label: "From earlier months",
        hint: "Profit of all months before this one",
        cents: summary.broughtForwardCents,
      },
      thisMonth: {
        id: "running-this-month",
        label: `This period (${periodText})`,
        cents: summary.netIncomeCents,
      },
      total: {
        id: "total-net-income",
        label: "Total profit so far",
        hint: "Same as TOTAL NET INCOME in your Excel",
        cents: summary.totalNetIncomeCents,
      },
    },
    debt: {
      id: "outstanding-debt",
      label: "Customers still owe you",
      hint: `${summary.openDebtCount} open debt${summary.openDebtCount === 1 ? "" : "s"}, not counted in profit`,
      cents: summary.outstandingDebtCents,
      href: "/records?tab=debts",
      openCount: summary.openDebtCount,
    },
    gcashMoved: [
      { label: "Cash In", cents: cashMovements.cashInCents },
      { label: "Cash Out", cents: cashMovements.cashOutCents },
      { label: "Load", cents: cashMovements.loadCents },
    ],
  };
}
