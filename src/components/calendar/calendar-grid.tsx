import Link from "next/link";

import type { Holiday } from "@/lib/calendar/holidays";
import type { DailyIncome } from "@/lib/finance/ledger";
import { formatPeso } from "@/lib/format";
import {
  HOLIDAY_STYLES,
  SHOP_DAY_LABELS,
  SHOP_DAY_STYLES,
} from "@/lib/calendar/constants";
import type { ResolvedDay } from "@/lib/calendar/defaults";
import { WEEKDAYS, buildMonthGrid } from "@/lib/calendar/grid";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  month: string;
  days: Map<string, ResolvedDay>;
  /** Sales + GCash charges + excess money per day. */
  income: Map<string, DailyIncome>;
  today: string;
  /** Philippine holidays of this month, by date. */
  holidays: Map<string, Holiday>;
  /** Link that opens the day dialog for a date. */
  dayHref: (date: string) => string;
}

/** A month of days. Each day is colored by its status; clicking it opens the day dialog. */
export function CalendarGrid({
  month,
  days,
  income,
  today,
  holidays,
  dayHref,
}: CalendarGridProps) {
  const weeks = buildMonthGrid(month);

  return (
    <div
      className="overflow-hidden rounded-xl border bg-card"
      data-testid="calendar-grid"
    >
      <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="py-2">
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {weeks.flat().map((cell) => {
          const row = cell.inMonth ? days.get(cell.date) : undefined;
          const earned = cell.inMonth ? income.get(cell.date) : undefined;
          const holiday = cell.inMonth ? holidays.get(cell.date) : undefined;
          const label = `${cell.date}${holiday ? ` (${holiday.name}, holiday)` : ""}: ${row ? SHOP_DAY_LABELS[row.status] : "not set"}${row?.isDefault ? " (Sunday default)" : ""}${row?.note ? `, ${row.note}` : ""}${earned ? `, earned ${formatPeso(earned.totalCents / 100)}` : ""}`;
          if (!cell.inMonth)
            return (
              <div
                key={cell.date}
                className="min-h-16 bg-muted/30 sm:min-h-24 xl:min-h-28 2xl:min-h-32"
                aria-hidden
              />
            );
          return (
            <Link
              key={cell.date}
              href={dayHref(cell.date)}
              scroll={false}
              aria-label={label}
              data-date={cell.date}
              data-status={row?.status ?? "NONE"}
              data-default={row?.isDefault ? "true" : undefined}
              data-holiday={holiday?.name}
              className={cn(
                "flex min-h-16 flex-col gap-0.5 [&>[data-testid=day-income]]:mt-auto border-l-4 bg-card p-1.5 text-left outline-none transition-colors hover:brightness-95 focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring sm:min-h-24 sm:p-2 xl:min-h-28 2xl:min-h-32",
                row
                  ? SHOP_DAY_STYLES[row.status].cell
                  : "border-transparent hover:bg-accent",
                cell.date === today && "ring-2 ring-inset ring-foreground/60",
              )}
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                  {cell.day}
                  {holiday ? (
                    <span
                      aria-hidden
                      className={cn(
                        "size-2.5 rounded-full",
                        HOLIDAY_STYLES.dot,
                      )}
                    />
                  ) : null}
                </span>
                {cell.date === today ? (
                  <span className="text-[10px] font-medium uppercase">
                    Today
                  </span>
                ) : null}
              </span>
              {holiday ? (
                <span
                  className={cn(
                    "line-clamp-2 rounded px-1 py-0.5 text-[10px] font-semibold leading-tight sm:text-[11px]",
                    HOLIDAY_STYLES.tag,
                  )}
                  data-testid="day-holiday"
                  title={holiday.name}
                >
                  {holiday.name}
                </span>
              ) : null}
              {row ? (
                <span className="text-xs font-medium">
                  {SHOP_DAY_LABELS[row.status]}
                </span>
              ) : null}
              {row?.note || row?.isDefault ? (
                <span className="line-clamp-2 hidden text-[11px] leading-tight opacity-80 sm:block">
                  {row.note ?? "Sunday"}
                </span>
              ) : null}
              {earned ? (
                <span
                  className="text-xs font-semibold tabular-nums sm:text-sm"
                  data-testid="day-income"
                >
                  {formatPeso(earned.totalCents / 100)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
