"use client";

import { ClientPagination } from "@/components/shared/client-pagination";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";

export interface MonthlySummaryRow {
  key: string;
  label: string;
  /** Already formatted: Sales, GCash charges, Expenses, Net income, Debt payments, Adjustments, Txns. */
  cells: string[];
}

const HEADINGS = ["Sales", "GCash charges", "Expenses", "Net income", "Debt payments", "Adjustments", "Txns"];

/** The per-month rows are paged 8 at a time; the combined total always stays visible. */
export function MonthlySummaryTable({ rows, totals }: { rows: MonthlySummaryRow[]; totals: string[] }) {
  const pager = usePagination(rows);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            {HEADINGS.map((heading) => (
              <TableHead key={heading} className="text-right">
                {heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pager.rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="whitespace-nowrap font-medium">{row.label}</TableCell>
              {row.cells.map((cell, index) => (
                <TableCell key={HEADINGS[index]} className="text-right tabular-nums">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Combined total</TableCell>
            {totals.map((cell, index) => (
              <TableCell key={HEADINGS[index]} className="text-right tabular-nums">
                {cell}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
      <ClientPagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.setPage} className="mt-3" />
    </>
  );
}
