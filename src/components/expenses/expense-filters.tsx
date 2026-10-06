import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { hasActiveExpenseFilters, type ExpenseFilters } from "@/lib/validation/expense-filters";

interface ExpenseFiltersBarProps {
  filters: ExpenseFilters;
  categories: { id: string; name: string }[];
}

/** A plain GET form: filters live in the URL, so it needs no client JavaScript. */
export function ExpenseFiltersBar({ filters, categories }: ExpenseFiltersBarProps) {
  return (
    <Card>
      <CardContent>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" defaultValue={filters.q} placeholder="Description, notes or category" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={filters.from} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={filters.to} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={filters.categoryId ?? ""}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:justify-end">
            {hasActiveExpenseFilters(filters) ? (
              <Button asChild variant="ghost">
                <Link href="/expenses">Clear</Link>
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
