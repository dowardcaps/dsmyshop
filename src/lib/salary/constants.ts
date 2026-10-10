/** Employees created automatically the first time the Salary tab is opened. Monthly salary in pesos. */
export const DEFAULT_EMPLOYEES = [
  { name: "Doward", monthlySalary: 3000 },
  { name: "Sophia", monthlySalary: 3000 },
] as const;

/** The salary is paid twice a month: on the 15th and on the 30th (the last day in February). */
export const FIRST_PAY_DAY = 15;
export const SECOND_PAY_DAY = 30;

export const SALARY_STATUSES = ["UNPAID", "PAID"] as const;
export type SalaryStatusValue = (typeof SALARY_STATUSES)[number];
export const SALARY_STATUS_LABELS: Record<SalaryStatusValue, string> = { UNPAID: "Unpaid", PAID: "Paid" };
