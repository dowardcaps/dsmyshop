"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useInventoryFilters } from "@/hooks/use-inventory-filters";
import { STOCK_LEVELS, STOCK_LEVEL_LABELS, type StockLevel } from "@/lib/inventory/stock";
import type { InventoryFilters } from "@/lib/validation/inventory-filters";

/** Search and stock level live in the URL and apply as you type / pick. */
export function InventoryFilterBar({ filters }: { filters: InventoryFilters }) {
  const { q, level, pending, changeSearch, changeLevel, clear } = useInventoryFilters(filters);
  const active = q.trim() !== "" || level !== "";

  return (
    <Card>
      <CardContent>
        <form
          role="search"
          aria-label="Filters"
          aria-busy={pending}
          onSubmit={(event) => event.preventDefault()}
          className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
        >
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor="inventory-q">Search</Label>
            <Input
              id="inventory-q"
              name="q"
              type="search"
              autoComplete="off"
              value={q}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Item name or notes"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inventory-level">Stock level</Label>
            <Select id="inventory-level" name="level" value={level} onChange={(event) => changeLevel(event.target.value as StockLevel | "")}>
              <option value="">All</option>
              {STOCK_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {STOCK_LEVEL_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          {active ? (
            <div className="flex items-end justify-end">
              <Button type="button" variant="ghost" onClick={clear}>
                Clear
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
