"use client";

import { ClientPagination } from "@/components/shared/client-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { formatPeso } from "@/lib/format";

interface SaleItemsTableProps {
  items: { id: string; categoryName: string; description: string; quantity: number; unitPrice: number; subtotal: number }[];
  /** Total of the whole sale (all items, not only the page shown). */
  totalAmount: number;
}

export function SaleItemsTable({ items, totalAmount }: SaleItemsTableProps) {
  const pager = usePagination(items);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit price</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pager.rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.categoryName}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPeso(item.unitPrice)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPeso(item.subtotal)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="text-right font-semibold">
              Total
            </TableCell>
            <TableCell className="text-right text-base font-semibold tabular-nums">{formatPeso(totalAmount)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <ClientPagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.setPage} className="mt-3" />
    </>
  );
}
