import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Returns the href for a given page number. */
  hrefForPage: (page: number) => string;
}

export function Pagination({ page, pageCount, hrefForPage }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          {page <= 1 ? (
            <span aria-disabled="true" className="pointer-events-none opacity-50">
              <ChevronLeft /> Previous
            </span>
          ) : (
            <Link href={hrefForPage(page - 1)}>
              <ChevronLeft /> Previous
            </Link>
          )}
        </Button>
        <Button asChild variant="outline" size="sm">
          {page >= pageCount ? (
            <span aria-disabled="true" className="pointer-events-none opacity-50">
              Next <ChevronRight />
            </span>
          ) : (
            <Link href={hrefForPage(page + 1)}>
              Next <ChevronRight />
            </Link>
          )}
        </Button>
      </div>
    </nav>
  );
}
