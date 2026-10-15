import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { monthLabel, shiftMonth } from "@/lib/calendar/grid";

export function MonthNav({
  month,
  currentMonth,
}: {
  month: string;
  currentMonth: string;
}) {
  const href = (m: string) =>
    m === currentMonth ? "/calendar" : `/calendar?month=${m}`;
  return (
    <nav aria-label="Month" className="flex items-center gap-2">
      <Button asChild variant="outline" size="icon" aria-label="Previous month">
        <Link href={href(shiftMonth(month, -1))}>
          <ChevronLeft />
        </Link>
      </Button>
      <h2
        className="min-w-40 text-center text-lg font-semibold"
        aria-live="polite"
        data-testid="cal-month"
      >
        {monthLabel(month)}
      </h2>
      <Button asChild variant="outline" size="icon" aria-label="Next month">
        <Link href={href(shiftMonth(month, 1))}>
          <ChevronRight />
        </Link>
      </Button>
      {month !== currentMonth ? (
        <Button asChild variant="ghost" size="sm">
          <Link href="/calendar">This month</Link>
        </Button>
      ) : null}
    </nav>
  );
}
