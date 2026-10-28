# Calendar (`/calendar`)

Marks each day as **Open** (green), **Half day** (yellow) or **Closed** (red). A day with no status is "Not set" (neutral), except **Sundays, which are closed by default**.

- Click a day to open the dialog: pick the status, optionally change **To** to set several days at once (max 62), add a note, Save. **Reset to default** removes what was saved, so a Sunday goes back to closed and any other day to "Not set".
- The cards above the grid count the month's open / half-day / closed / not-set days.
- Month navigation: `?month=YYYY-MM`. The day dialog is URL-driven (`?day=YYYY-MM-DD`), like the Records dialogs.

## Code
- `prisma/schema.prisma`: `ShopDay` (one row per user per date, unique) and enum `ShopDayStatus`. Needs a migration: `npm run db:migrate -- --name add_shop_calendar`.
- `lib/calendar/{constants,grid,queries,service}.ts`: colors and labels, pure month-grid maths, month query, range upsert/clear.
- `lib/validation/calendar.ts`, `lib/actions/calendar.ts`, `hooks/use-shop-day-form.ts`.
- `components/calendar/*`, `app/(app)/calendar/page.tsx`. Sidebar entry in `lib/navigation.ts`.

The calendar is informational: it does not change sales, net income or reports.

## Daily earnings
Each day shows what came in that day: **sales + GCash charges + excess money** (`getDailyIncome` in `lib/finance/ledger.ts`, same ledger as the Dashboard). The page shows "Earned this month", and the day dialog splits the day into Sales / GCash charges / Excess money. Cash In/Out amounts are not income, only the charge is. A closed day that still has earnings shows both, which makes mistakes easy to spot.

## Sundays closed by default
Nothing is saved for default Sundays: `resolveMonth` (`lib/calendar/defaults.ts`) fills them in when the month is shown, so it works for every past and future month with no migration. Setting a Sunday to Open or Half day saves a row that overrides the default. Change which weekdays are closed by editing `DEFAULT_CLOSED_WEEKDAYS` in `lib/calendar/constants.ts` (0 = Sunday).

## Daily trend graph
Under the calendar there is a **Daily trend** bar graph for the month shown: one bar per day from the 1st up to today (a whole month for past months, nothing for future months). Days with no sales show as 0, so a slow or closed day is a dip.
- **Sales / All earnings** switch: sales only, or sales + GCash charges + excess money (the same number as in the calendar boxes). Unpaid sales are never counted.
- The orange dashed line over the bars is the **7-day average** (each day averaged with the 6 days before it). If it climbs, sales are going up; if it falls, they are going down.
- Above the graph: total so far, average per day, best day, and **Up / Down / About the same vs last month**, compared over the *same number of days* (so mid-month is not unfairly compared with a whole month). Changes under 2% count as "about the same".
- Code: `src/lib/calendar/trend.ts` (pure logic), `src/components/calendar/sales-trend-chart.tsx`, wired in `src/app/(app)/calendar/page.tsx`. No database change.

## Layout
The Calendar page uses the whole screen width. On wide screens (1280px and up) the month grid is on the left, with taller day boxes on very wide screens, and a **Month overview** column on the right: the Open / Half day / Closed / Not set counts, "Earned this month", and the Daily trend graph. On smaller screens everything stacks in one column. Code: `src/app/(app)/calendar/page.tsx`, width rule in `src/components/layout/app-main.tsx`.
