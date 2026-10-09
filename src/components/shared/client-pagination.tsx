"use client";

import { PaginationLayout } from "@/components/shared/pagination-layout";
import { Button } from "@/components/ui/button";

interface ClientPaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  className?: string;
}

/**
 * Pager for lists held in the browser (searchable lists, small tables). Use it with the
 * usePagination hook. For server-paginated lists use <Pagination>, which links to ?page=N.
 */
export function ClientPagination({ page, pageCount, onPageChange, total, pageSize, className }: ClientPaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <PaginationLayout
      page={page}
      pageCount={pageCount}
      total={total}
      pageSize={pageSize}
      className={className}
      renderControl={({ target, label, disabled, active, children }) => (
        <Button
          type="button"
          variant={active ? "default" : "outline"}
          size="sm"
          className="min-w-8"
          disabled={disabled}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          onClick={() => onPageChange(target)}
        >
          {children}
        </Button>
      )}
    />
  );
}
