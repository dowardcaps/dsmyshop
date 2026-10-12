/**
 * The ONE net income formula (all money in integer centavos). It follows Sales.xlsx:
 *
 *   Revenue          = Sales + GCash charges
 *   Net income       = Revenue + Excess money
 *                      - Expenses - Reimbursements - Salary paid out - Short
 *   Total net income = Brought forward (net income of all earlier months) + Net income
 *
 * In Sales.xlsx the sheet's "TOTAL NET INCOME" = total sales + net income from the previous month
 * - total expenses - salary/reimbursement - short. "Brought forward" is that previous-month balance.
 *
 * NOT revenue: GCash Cash In / Cash Out / Load amounts (money moved for customers).
 * Salary paid out is cash actually handed over: advances on the day they were given, plus the rest of a
 * pay date on the day it was marked paid. It is never counted twice.
 */

export interface CashComponents {
  salesCents: number;
  gcashChargesCents: number;
  excessCents: number;
  expensesCents: number;
  reimbursementsCents: number;
  salaryPaidCents: number;
  shortCents: number;
}

export const emptyComponents = (): CashComponents => ({
  salesCents: 0,
  gcashChargesCents: 0,
  excessCents: 0,
  expensesCents: 0,
  reimbursementsCents: 0,
  salaryPaidCents: 0,
  shortCents: 0,
});

export const revenueOf = (c: CashComponents): number => c.salesCents + c.gcashChargesCents;

/** What is added to revenue and what is taken away, for display. */
export const totalDeductionsOf = (c: CashComponents): number => c.expensesCents + c.reimbursementsCents + c.salaryPaidCents + c.shortCents;

export function netIncomeOf(c: CashComponents): number {
  return revenueOf(c) + c.excessCents - totalDeductionsOf(c);
}

/** Net income of the period plus everything carried over from earlier months. */
export const totalNetIncomeOf = (broughtForwardCents: number, c: CashComponents): number => broughtForwardCents + netIncomeOf(c);

export function addComponents(a: CashComponents, b: CashComponents): CashComponents {
  return {
    salesCents: a.salesCents + b.salesCents,
    gcashChargesCents: a.gcashChargesCents + b.gcashChargesCents,
    excessCents: a.excessCents + b.excessCents,
    expensesCents: a.expensesCents + b.expensesCents,
    reimbursementsCents: a.reimbursementsCents + b.reimbursementsCents,
    salaryPaidCents: a.salaryPaidCents + b.salaryPaidCents,
    shortCents: a.shortCents + b.shortCents,
  };
}

/** Keys used by the ledger query, mapped to the component they feed. */
export const LEDGER_KEYS = {
  sales: "salesCents",
  charges: "gcashChargesCents",
  excess: "excessCents",
  expenses: "expensesCents",
  reimbursements: "reimbursementsCents",
  salary: "salaryPaidCents",
  short: "shortCents",
} as const satisfies Record<string, keyof CashComponents>;

export type LedgerKey = keyof typeof LEDGER_KEYS;

export function isLedgerKey(value: string): value is LedgerKey {
  return Object.hasOwn(LEDGER_KEYS, value);
}

/** Adds one ledger row ("sales", 12345 centavos) to a components object. */
export function addLedgerRow(target: CashComponents, key: string, cents: number): void {
  if (isLedgerKey(key)) target[LEDGER_KEYS[key]] += cents;
}
