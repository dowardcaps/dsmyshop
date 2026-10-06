import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { currentPeriod, MONTH_NAMES, type DashboardPeriod } from "@/lib/dashboard/period";

interface PeriodFilterProps {
  period: DashboardPeriod;
  years: number[];
}

/** A plain GET form: the period lives in the URL (?year=2026&month=9), so it needs no client JavaScript. */
export function PeriodFilter({ period, years }: PeriodFilterProps) {
  const now = currentPeriod();
  const isCurrent = period.year === now.year && period.month === now.month;

  return (
    <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Dashboard period">
      <div className="space-y-1">
        <Label htmlFor="month">Month</Label>
        <Select id="month" name="month" defaultValue={period.month === null ? "all" : String(period.month)} className="w-40">
          <option value="all">Whole year</option>
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="year">Year</Label>
        <Select id="year" name="year" defaultValue={String(period.year)} className="w-28">
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit">Apply</Button>
      {!isCurrent ? (
        <Button asChild variant="ghost">
          <Link href="/dashboard">This month</Link>
        </Button>
      ) : null}
    </form>
  );
}
