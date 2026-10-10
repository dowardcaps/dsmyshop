import type { FilterValues } from "@/lib/records/filter-state";
import type { DebtFilters } from "@/lib/validation/debt-filters";
import type { ExpenseFilters } from "@/lib/validation/expense-filters";
import type { ExcessFilters } from "@/lib/validation/excess-filters";
import type { SalaryFilters } from "@/lib/validation/salary-filters";
import type { GcashFilters } from "@/lib/validation/gcash-filters";
import type { SaleFilters } from "@/lib/validation/sale-filters";

/** Validated filters -> the plain URL-param values the filter bar edits. */
const shared = (f: { q?: string; from?: string; to?: string }): FilterValues => ({ q: f.q ?? "", from: f.from ?? "", to: f.to ?? "" });

export const saleFilterValues = (f: SaleFilters): FilterValues => ({ ...shared(f), category: f.categoryId ?? "", payment: f.paymentMethod ?? "" });
export const gcashFilterValues = (f: GcashFilters): FilterValues => ({ ...shared(f), type: f.type ?? "", provider: f.provider ?? "" });
export const expenseFilterValues = (f: ExpenseFilters): FilterValues => ({ ...shared(f), category: f.categoryId ?? "" });
export const excessFilterValues = (f: ExcessFilters): FilterValues => shared(f);
export const salaryFilterValues = (f: SalaryFilters): FilterValues => ({ ...shared(f), employee: f.employeeId ?? "", status: f.status ?? "" });
export const debtFilterValues = (f: DebtFilters): FilterValues => ({ ...shared(f), status: f.status ?? "" });
