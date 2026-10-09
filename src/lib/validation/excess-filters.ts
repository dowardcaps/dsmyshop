import { TABLE_PAGE_SIZE } from "@/lib/pagination";
import { firstParam, parseDateParam, parsePageParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export interface ExcessFilters {
  q?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseExcessFilters(params: RawSearchParams): ExcessFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    page: parsePageParam(params.page),
    pageSize: TABLE_PAGE_SIZE,
  };
}

export const hasActiveExcessFilters = (filters: ExcessFilters): boolean => Boolean(filters.q || filters.from || filters.to);
