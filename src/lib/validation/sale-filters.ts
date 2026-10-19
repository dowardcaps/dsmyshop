import { PAYMENT_METHODS, PAYMENT_STATUSES, SALES_PAGE_SIZE, type PaymentMethodValue, type PaymentStatusValue } from "@/lib/sales/constants";
import {
  firstParam,
  parseDateParam,
  parseEnumParam,
  parsePageParam,
  type RawSearchParams,
} from "@/lib/validation/filter-utils";

export interface SaleFilters {
  q?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethodValue;
  status?: PaymentStatusValue;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseSaleFilters(params: RawSearchParams): SaleFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    categoryId: firstParam(params.category),
    paymentMethod: parseEnumParam(params.payment, PAYMENT_METHODS),
    status: parseEnumParam(params.status, PAYMENT_STATUSES),
    page: parsePageParam(params.page),
    pageSize: SALES_PAGE_SIZE,
  };
}

/** Builds a /sales query string from filters, optionally overriding the page. */
export function saleFiltersToQuery(filters: SaleFilters, page?: number): string {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.categoryId) search.set("category", filters.categoryId);
  if (filters.paymentMethod) search.set("payment", filters.paymentMethod);
  if (filters.status) search.set("status", filters.status);
  const target = page ?? filters.page;
  if (target > 1) search.set("page", String(target));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const hasActiveFilters = (filters: SaleFilters): boolean =>
  Boolean(filters.q || filters.from || filters.to || filters.categoryId || filters.paymentMethod || filters.status);
