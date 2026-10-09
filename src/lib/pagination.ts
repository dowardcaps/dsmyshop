/** Every table in the app shows at most this many rows per page. */
export const TABLE_PAGE_SIZE = 8;

export interface Page<T> {
  rows: T[];
  /** The page actually shown (1-based), kept inside 1..pageCount. */
  page: number;
  pageCount: number;
}

export function pageCountFor(total: number, pageSize = TABLE_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** One page of an in-memory list. An out-of-range page is clamped, so deleting the last row of the last page lands on the new last page. */
export function paginate<T>(rows: readonly T[], page: number, pageSize = TABLE_PAGE_SIZE): Page<T> {
  const pageCount = pageCountFor(rows.length, pageSize);
  const current = Math.min(Math.max(Math.floor(Number.isFinite(page) ? page : 1), 1), pageCount);
  return { rows: rows.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount };
}

/** "1–8" style bounds for the "Showing 1–8 of 97" label (both 0 for an empty list). */
export function pageRange(page: number, total: number, pageSize = TABLE_PAGE_SIZE): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total) };
}

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Page numbers to show: always the first and last page, the current page and its neighbours, and
 * an ellipsis for each gap, e.g. 1 … 5 6 7 … 13. Short lists show every page.
 */
export function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pageCount - 1) items.push("ellipsis-end");
  items.push(pageCount);
  return items;
}
