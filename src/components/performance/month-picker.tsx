import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";

import { PrintButton } from "@/components/performance/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMonths, monthLabel } from "@/lib/performance/months";

/** Plain GET form: the month lives in the URL (?month=2026-11), so it works without client JavaScript. */
export function MonthPicker({
  month,
  tab,
  currentMonth,
  showExport = true,
}: {
  month: string;
  tab: string;
  currentMonth: string;
  showExport?: boolean;
}) {
  const href = (m: string) => `/performance?tab=${tab}&month=${m}`;
  return (
    <div className="flex flex-wrap items-end gap-2 print:hidden">
      <Button asChild variant="outline" size="icon" aria-label="Previous month">
        <Link href={href(addMonths(month, -1))}>
          <ChevronLeft />
        </Link>
      </Button>
      <form
        method="get"
        className="flex items-end gap-2"
        aria-label="Choose month"
      >
        <input type="hidden" name="tab" value={tab} />
        <div className="space-y-1">
          <Label htmlFor="perf-month" className="sr-only">
            Month
          </Label>
          <Input
            id="perf-month"
            type="month"
            name="month"
            defaultValue={month}
            className="w-44"
          />
        </div>
        <Button type="submit" variant="secondary">
          Show
        </Button>
      </form>
      <Button asChild variant="outline" size="icon" aria-label="Next month">
        <Link href={href(addMonths(month, 1))}>
          <ChevronRight />
        </Link>
      </Button>
      {month !== currentMonth ? (
        <Button asChild variant="ghost">
          <Link href={href(currentMonth)}>This month</Link>
        </Button>
      ) : null}
      <span className="sr-only">{monthLabel(month)}</span>
      {showExport ? (
        <>
          <Button asChild variant="outline">
            <a href={`/performance/export?month=${month}`} download>
              <Download /> CSV
            </a>
          </Button>
          <PrintButton icon={<Printer />} />
        </>
      ) : null}
    </div>
  );
}
