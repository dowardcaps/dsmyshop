import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/sales/constants";
import type { SaleFilters } from "@/lib/validation/sale-filters";
import { hasActiveFilters } from "@/lib/validation/sale-filters";

interface SaleFiltersBarProps {
  filters: SaleFilters;
  categories: { id: string; name: string }[];
}

/** A plain GET form: filters live in the URL, so it needs no client JavaScript. */
export function SaleFiltersBar({ filters, categories }: SaleFiltersBarProps) {
  return (
    <Card>
      <CardContent>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" defaultValue={filters.q} placeholder="Transaction no., customer, item, notes" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={filters.from} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={filters.to} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={filters.categoryId ?? ""}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="payment">Payment</Label>
            <Select id="payment" name="payment" defaultValue={filters.paymentMethod ?? ""}>
              <option value="">All</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
            {hasActiveFilters(filters) ? (
              <Button asChild variant="ghost">
                <Link href="/sales">Clear</Link>
              </Button>
            ) : null}
            <Button type="submit">
              <Search /> Apply filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
