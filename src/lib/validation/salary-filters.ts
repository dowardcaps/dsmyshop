import { TABLE_PAGE_SIZE } from "@/lib/pagination";
import { SALARY_STATUSES, type SalaryStatusValue } from "@/lib/salary/constants";
import { firstParam, parseDateParam, parseEnumParam, parsePageParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export interface SalaryFilters {
  q?: string;
  /** Pay date range for pay dates, advance date range for advances. */
  from?: string;
  to?: string;
  employeeId?: string;
  status?: SalaryStatusValue;
  page: number;
  /** Page of the cash advances table. */
  advancePage: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseSalaryFilters(params: RawSearchParams): SalaryFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    employeeId: firstParam(params.employee),
    status: parseEnumParam(params.status, SALARY_STATUSES),
    page: parsePageParam(params.page),
    advancePage: parsePageParam(params.apage),
    pageSize: TABLE_PAGE_SIZE,
  };
}

export const hasActiveSalaryFilters = (f: SalaryFilters): boolean => Boolean(f.q || f.from || f.to || f.employeeId || f.status);
