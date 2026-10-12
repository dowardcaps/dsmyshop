import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { STOCK_LEVELS, STOCK_LEVEL_LABELS } from "@/lib/inventory/stock";
import type { InventoryFilters } from "@/lib/validation/inventory-filters";
import { hasActiveInventoryFilters } from "@/lib/validation/inventory-filters";

/** A plain GET form: search and level live in the URL, so a refresh or bookmark keeps them. */
export function InventoryFilterBar({ filters }: { filters: InventoryFilters }) {
  return (
    <Card>
      <CardContent>
        <form method="get" action="/inventory" aria-label="Filters" className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor="inventory-q">Search</Label>
            <Input id="inventory-q" name="q" defaultValue={filters.q ?? ""} placeholder="Item name or notes" maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inventory-level">Stock level</Label>
            <Select id="inventory-level" name="level" defaultValue={filters.level ?? ""}>
              <option value="">All</option>
              {STOCK_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {STOCK_LEVEL_LABELS[level]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end justify-end gap-2">
            {hasActiveInventoryFilters(filters) ? (
              <Button asChild variant="ghost">
                <Link href="/inventory">Clear</Link>
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
