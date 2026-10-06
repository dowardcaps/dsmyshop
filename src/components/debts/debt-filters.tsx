import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DEBT_STATUSES, DEBT_STATUS_LABELS } from "@/lib/debts/constants";
import { hasActiveDebtFilters, type DebtFilters } from "@/lib/validation/debt-filters";

/** A plain GET form: filters live in the URL, so it needs no client JavaScript. */
export function DebtFiltersBar({ filters }: { filters: DebtFilters }) {
  return (
    <Card>
      <CardContent>
        <form method="get" className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" defaultValue={filters.q} placeholder="Name or description" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={filters.status ?? ""}>
              <option value="">All</option>
              {DEBT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {DEBT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end justify-end gap-2 sm:col-span-3">
            {hasActiveDebtFilters(filters) ? (
              <Button asChild variant="ghost">
                <Link href="/debts">Clear</Link>
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
