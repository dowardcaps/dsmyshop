import { TABLE_PAGE_SIZE } from "@/lib/pagination";
import { STOCK_LEVELS, type StockLevel } from "@/lib/inventory/stock";
import { firstParam, parseEnumParam, parsePageParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export interface InventoryFilters {
  q?: string;
  level?: StockLevel;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseInventoryFilters(params: RawSearchParams): InventoryFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    level: parseEnumParam(params.level, STOCK_LEVELS),
    page: parsePageParam(params.page),
    pageSize: TABLE_PAGE_SIZE,
  };
}

export const hasActiveInventoryFilters = (filters: InventoryFilters): boolean => Boolean(filters.q || filters.level);
