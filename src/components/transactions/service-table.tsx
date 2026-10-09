"use client";

import { Minus, Plus } from "lucide-react";

import { ClientPagination } from "@/components/shared/client-pagination";
import { CategoryBadge } from "@/components/transactions/category-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "@/lib/format";
import type { PosService } from "@/lib/transactions/cart";
import { TABLE_PAGE_SIZE } from "@/lib/pagination";
import { MAX_QUANTITY } from "@/lib/transactions/constants";
import { cn } from "@/lib/utils";

interface ServiceTableProps {
  services: PosService[];
  quantityOf: (serviceId: string) => number;
  onChange: (serviceId: string, delta: number) => void;
  onSet: (serviceId: string, qty: number) => void;
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}

export function ServiceTable({ services, quantityOf, onChange, onSet, page, pageCount, total, onPage }: ServiceTableProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0 lg:min-h-[35rem]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service / item</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                No services match your search.
              </TableCell>
            </TableRow>
          ) : (
            services.map((service) => {
              const qty = quantityOf(service.id);
              return (
                <TableRow key={service.id} className={cn(qty > 0 && "bg-accent/40")}>
                  <TableCell className="whitespace-normal font-medium">
                    {service.name}
                    {/* The Category column is hidden on phones, so the badge moves under the name. */}
                    <span className="mt-1 block sm:hidden">
                      <CategoryBadge name={service.categoryName} />
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <CategoryBadge name={service.categoryName} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPeso(service.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => onChange(service.id, -1)}
                        disabled={qty === 0}
                        aria-label={`Decrease ${service.name}`}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={MAX_QUANTITY}
                        value={qty}
                        onChange={(event) => onSet(service.id, Number.parseInt(event.target.value, 10) || 0)}
                        aria-label={`Quantity of ${service.name}`}
                        className="h-8 w-14 px-1 text-center tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => onChange(service.id, 1)}
                        aria-label={`Increase ${service.name}`}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <ClientPagination page={page} pageCount={pageCount} total={total} pageSize={TABLE_PAGE_SIZE} onPageChange={onPage} className="mt-auto border-t px-4 py-3" />
    </Card>
  );
}
