import Link from "next/link";

import { PaginationLayout } from "@/components/shared/pagination-layout";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Returns the href for a given page number. */
  hrefForPage: (page: number) => string;
  /** Total rows across all pages, for the "Showing 1–8 of 97" label. */
  total?: number;
  pageSize?: number;
  className?: string;
}

/**
 * Pager for server-paginated lists (the page number lives in the URL, e.g. /sales?page=2).
 * Every control is a real link, so it works without JavaScript and can be bookmarked.
 * For lists held in the browser use <ClientPagination>.
 */
export function Pagination({ page, pageCount, hrefForPage, total, pageSize, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <PaginationLayout
      page={page}
      pageCount={pageCount}
      total={total}
      pageSize={pageSize}
      className={className}
      renderControl={({ target, label, disabled, active, children }) =>
        disabled ? (
          <Button variant="outline" size="sm" disabled aria-label={label} className="min-w-8">
            {children}
          </Button>
        ) : (
          <Button asChild variant={active ? "default" : "outline"} size="sm" className="min-w-8">
            <Link href={hrefForPage(target)} aria-label={label} aria-current={active ? "page" : undefined}>
              {children}
            </Link>
          </Button>
        )
      }
    />
  );
}
