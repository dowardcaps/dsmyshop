import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { pageItems, pageRange } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export interface PageControlProps {
  /** The page this control goes to. */
  target: number;
  label: string;
  disabled: boolean;
  /** True for the current page's number button. */
  active: boolean;
  children: ReactNode;
}

export interface PaginationLayoutProps {
  page: number;
  pageCount: number;
  /** Total rows across all pages. Enables the "Showing 1–8 of 97" label. */
  total?: number;
  pageSize?: number;
  className?: string;
  /** Renders one control: a link in <Pagination>, a button in <ClientPagination>. */
  renderControl: (control: PageControlProps) => ReactNode;
}

/**
 * The shared look of every pager: "Showing 1–8 of 97", Previous, numbered pages, Next.
 * On phones the numbers collapse to "Page 2 of 13". It has no behaviour of its own; the two
 * wrappers around it decide whether a click is a link or a state change.
 */
export function PaginationLayout({ page, pageCount, total, pageSize, className, renderControl }: PaginationLayoutProps) {
  const range = total !== undefined && pageSize ? pageRange(page, total, pageSize) : null;

  return (
    <nav aria-label="Pagination" className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground" data-testid="pagination-summary">
        {range ? (
          <>
            Showing <span className="font-medium text-foreground">{range.from}–{range.to}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>
            Page {page} of {pageCount}
          </>
        )}
      </p>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        {renderControl({
          target: page - 1,
          label: "Previous page",
          disabled: page <= 1,
          active: false,
          children: (
            <>
              <ChevronLeft /> <span className="hidden sm:inline">Previous</span>
            </>
          ),
        })}

        <span className="px-2 text-sm text-muted-foreground sm:hidden">
          Page {page} of {pageCount}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(page, pageCount).map((item) =>
            typeof item === "number" ? (
              <span key={item}>
                {renderControl({ target: item, label: `Page ${item}`, disabled: false, active: item === page, children: item })}
              </span>
            ) : (
              <span key={item} aria-hidden="true" className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ),
          )}
        </div>

        {renderControl({
          target: page + 1,
          label: "Next page",
          disabled: page >= pageCount,
          active: false,
          children: (
            <>
              <span className="hidden sm:inline">Next</span> <ChevronRight />
            </>
          ),
        })}
      </div>
    </nav>
  );
}
