import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  GCASH_PROVIDERS,
  GCASH_PROVIDER_LABELS,
  GCASH_TRANSACTION_TYPES,
  GCASH_TYPE_LABELS,
} from "@/lib/gcash/constants";
import { hasActiveGcashFilters, type GcashFilters } from "@/lib/validation/gcash-filters";

/** A plain GET form: filters live in the URL, so it needs no client JavaScript. */
export function GcashFiltersBar({ filters }: { filters: GcashFilters }) {
  return (
    <Card>
      <CardContent>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="q">Search notes</Label>
            <Input id="q" name="q" defaultValue={filters.q} placeholder="e.g. name or reference" />
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
            <Label htmlFor="type">Type</Label>
            <Select id="type" name="type" defaultValue={filters.type ?? ""}>
              <option value="">All</option>
              {GCASH_TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {GCASH_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="provider">Provider</Label>
            <Select id="provider" name="provider" defaultValue={filters.provider ?? ""}>
              <option value="">All</option>
              {GCASH_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {GCASH_PROVIDER_LABELS[provider]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
            {hasActiveGcashFilters(filters) ? (
              <Button asChild variant="ghost">
                <Link href="/gcash">Clear</Link>
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
