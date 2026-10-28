import {
  SHOP_DAY_LABELS,
  SHOP_DAY_STATUSES,
  SHOP_DAY_STYLES,
  type ShopDayStatusValue,
} from "@/lib/calendar/constants";
import { cn } from "@/lib/utils";

interface CalendarLegendProps {
  counts: Record<ShopDayStatusValue, number>;
  notSet: number;
  className?: string;
}

/** The color key, with how many days of the month fall in each. */
export function CalendarLegend({
  counts,
  notSet,
  className,
}: CalendarLegendProps) {
  return (
    <section
      aria-label="Month summary"
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}
    >
      {SHOP_DAY_STATUSES.map((status) => (
        <div
          key={status}
          className={cn(
            "rounded-xl border px-4 py-3",
            SHOP_DAY_STYLES[status].chip,
          )}
          data-testid={`cal-${status}`}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                "size-2.5 rounded-full",
                SHOP_DAY_STYLES[status].dot,
              )}
              aria-hidden
            />
            {SHOP_DAY_LABELS[status]}
          </p>
          <p
            className="mt-1 text-2xl font-semibold tabular-nums"
            data-testid={`cal-${status}-value`}
          >
            {counts[status]}
          </p>
        </div>
      ))}
      <div
        className="rounded-xl border bg-card px-4 py-3"
        data-testid="cal-NONE"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span
            className="size-2.5 rounded-full border border-muted-foreground/50"
            aria-hidden
          />
          Not set
        </p>
        <p
          className="mt-1 text-2xl font-semibold tabular-nums"
          data-testid="cal-NONE-value"
        >
          {notSet}
        </p>
      </div>
    </section>
  );
}
