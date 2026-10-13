import Link from "next/link";
import { Pencil } from "lucide-react";

import { StockBadge, STOCK_ROW_ACCENT } from "@/components/inventory/stock-badge";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteInventoryAction } from "@/lib/actions/inventory";
import type { InventoryRow } from "@/lib/inventory/queries";
import { cn } from "@/lib/utils";

export function InventoryTable({ rows, editHref }: { rows: InventoryRow[]; editHref: (id: string) => string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Item</TableHead>
            <TableHead className="text-right">In stock</TableHead>
            <TableHead>Stock level</TableHead>
            <TableHead className="hidden md:table-cell">Low / High at</TableHead>
            <TableHead className="hidden lg:table-cell">Subtracted when sold</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = `${row.name}, ${row.quantity} in stock`;
            return (
              <TableRow key={row.id} data-level={row.level}>
                <TableCell className={cn("font-medium", STOCK_ROW_ACCENT[row.level])}>
                  {row.name}
                  {row.notes ? <p className="max-w-64 truncate text-xs font-normal text-muted-foreground">{row.notes}</p> : null}
                </TableCell>
                <TableCell className="text-right text-base font-semibold tabular-nums">{row.quantity.toLocaleString("en-PH")}</TableCell>
                <TableCell>
                  <StockBadge level={row.level} />
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground tabular-nums md:table-cell">
                  {row.lowLevel} / {row.highLevel}
                </TableCell>
                <TableCell className="hidden max-w-72 text-muted-foreground lg:table-cell">
                  {row.links.length === 0 ? (
                    "Manual only"
                  ) : (
                    <ul className="space-y-0.5 text-xs">
                      {row.links.map((link) => (
                        <li key={link.serviceItemId}>
                          {link.label}
                          {link.unitsPerSale > 1 ? <span className="tabular-nums"> (uses {link.unitsPerSale})</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${label}`}>
                      <Link href={editHref(row.id)} scroll={false}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <ConfirmDeleteButton
                      action={deleteInventoryAction.bind(null, row.id)}
                      title="Delete this item?"
                      description={`${row.name} will be removed from your inventory. Past sales are not affected. This cannot be undone.`}
                      successMessage="Item deleted."
                      ariaLabel={`Delete ${label}`}
                      confirmLabel="Delete item"
                      iconOnly
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
