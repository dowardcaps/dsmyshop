import { PageHeader } from "@/components/layout/page-header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { DayEarnings } from "@/components/calendar/day-earnings";
import { resolveMonth } from "@/lib/calendar/defaults";
import { DayForm } from "@/components/calendar/day-form";
import { MonthNav } from "@/components/calendar/month-nav";
import { RecordDialog } from "@/components/records/record-dialog";
import { requireUser } from "@/lib/auth/require-user";
import {
  SHOP_DAY_STATUSES,
  type ShopDayStatusValue,
} from "@/lib/calendar/constants";
import {
  dayLabel,
  daysInMonth,
  monthEnd,
  monthStart,
  parseDayParam,
  parseMonthParam,
} from "@/lib/calendar/grid";
import { getDailyIncome } from "@/lib/finance/ledger";
import { formatPeso } from "@/lib/format";
import { listShopDays } from "@/lib/calendar/queries";
import { todayInManila } from "@/lib/dates";
import {
  firstParam,
  type RawSearchParams,
} from "@/lib/validation/filter-utils";

export const metadata = { title: "Calendar | DS Finance" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = todayInManila();
  const currentMonth = today.slice(0, 7);
  const month = parseMonthParam(firstParam(params.month));
  const day = parseDayParam(firstParam(params.day));
  const [saved, income] = await Promise.all([
    listShopDays(user.id, month),
    getDailyIncome(user.id, monthStart(month), monthEnd(month)),
  ]);
  const monthTotal = [...income.values()].reduce(
    (sum, d) => sum + d.totalCents,
    0,
  );

  const days = resolveMonth(month, saved);
  const counts = Object.fromEntries(
    SHOP_DAY_STATUSES.map((s) => [s, 0]),
  ) as Record<ShopDayStatusValue, number>;
  for (const row of days.values()) counts[row.status] += 1;
  const notSet = daysInMonth(month) - days.size;

  const closeHref =
    month === currentMonth ? "/calendar" : `/calendar?month=${month}`;
  const dayHref = (date: string) => `/calendar?month=${month}&day=${date}`;
  const existing = day ? days.get(day) : undefined;
  const hasSavedStatus = day ? saved.has(day) : false;
  const dayIncome = day ? income.get(day) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Mark each day as open, half day or closed, so everyone knows when the shop was open."
      />
      <MonthNav month={month} currentMonth={currentMonth} />
      <CalendarLegend counts={counts} notSet={notSet} />
      <p className="text-sm" data-testid="cal-month-total">
        Earned this month:{" "}
        <span className="font-semibold tabular-nums">
          {formatPeso(monthTotal / 100)}
        </span>
        <span className="text-muted-foreground">
          {" "}
          (sales + GCash charges + excess money)
        </span>
      </p>
      <CalendarGrid
        month={month}
        days={days}
        income={income}
        today={today}
        dayHref={dayHref}
      />
      <p className="text-sm text-muted-foreground">
        Click a day to set it. Green is open, yellow is a half day, red is
        closed.
      </p>

      {day ? (
        <RecordDialog
          title={dayLabel(day)}
          description="Set whether the shop was open, half day or closed."
          closeHref={closeHref}
        >
          <DayEarnings income={dayIncome} />
          <DayForm
            key={day}
            returnHref={closeHref}
            hasStatus={hasSavedStatus}
            defaultValues={{
              fromDate: day,
              toDate: day,
              status: existing?.status ?? "OPEN",
              note: existing?.note ?? "",
            }}
          />
        </RecordDialog>
      ) : null}
    </div>
  );
}
