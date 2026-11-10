# Performance (Business Performance)

Page: **Performance** in the side menu (`/performance`). Tabs: Overview (today vs the daily target, the month vs the monthly target, one daily chart), Break-even and Settings. Pick the month at the top.

## Basis (different from the Dashboard on purpose)
The Dashboard follows Sales.xlsx (cash basis: salary counts when it is paid out). Performance asks "did the shop earn its keep?":

```
Gross sales   = paid Sales + GCash charges + Excess money   (same as "Earned" on the Calendar and Money in on the Dashboard)
Gross profit  = Gross sales - Material costs
Net profit    = Gross profit - Fixed cost allocation - Other expenses
```
- **Fixed costs** (rent and electricity, internet, transaction expenses, plus employee salaries from the Salary tab) are counted **once** per month. In the daily view each day *with sales* carries `monthly fixed / operating days` (₱13,300 / 26 = ₱511.54). Days without sales carry none, so the sum of the days can differ slightly from the monthly figure; the monthly figure is the one to trust.
- **Material costs** = expenses whose category is marked *Material cost*. **Other expenses** = categories marked *Other expense* (the default). Categories marked *Fixed cost* are skipped, so a "Rent" expense is not subtracted twice. Set this on **Performance > Settings > How expense categories count**.
- Reimbursements and Short are not part of Performance.

## Reference scenario (checked by `src/lib/performance/calc.test.ts`)
Sales 1,000, materials 250, other 50, fixed share 511.54 -> daily net **188.46**. 26 days of that, fixed 13,300 -> monthly net **4,900**.

## Break-even
- Fixed-only break-even = fixed per day (₱511.54). It assumes no material costs.
- Full break-even = fixed per day / (1 - variable cost %). The variable cost % is the value saved in Settings, or if empty, the real (materials + other) / sales share of the month.
- The calculator tab starts from your saved numbers; the boxes are what-if only and are never saved.

## Targets
Minimum 600, daily 1,000, growth 1,500 and operating days 26 are editable (saved, with a confirmation). Status labels: Below Break-Even, Break-Even Reached (>= break-even), Target In Progress (>= minimum), Target Achieved (>= daily), Growth Target Achieved (>= growth). Monthly target = daily target x operating days; "needs about X a day" = remaining / remaining operating days (operating days minus days that had sales).

## Editing fixed costs without rewriting history
Changing an amount asks for the month it applies **from**. The old row is closed the month before and a new row starts, so earlier months keep what applied then. Removing a cost also ends it from a chosen month.

## Data
Migration `20261108120000_add_business_performance` (additive only): enum `ExpenseKind`, `ExpenseCategory.kind` (default VARIABLE), tables `BusinessSettings` and `FixedExpense`. Defaults are created the first time the page opens.
Code: `src/lib/performance/` (calc, queries, service, csv), `src/components/performance/`, `src/app/(app)/performance/`, `src/lib/actions/performance.ts`.
Tests: `npm run test:performance`.

## Limits
- Materials are the purchases you record as expenses in Material categories, not stock actually used. There is no per-sale material link yet.
- Date filtering is by month (previous/next, or any month), not arbitrary dates.
- The profit-and-loss Details tab, the Daily table and the CSV/Print export were removed to keep the page simple. The profit maths (`calc.ts`, `queries.ts`) is still there if you want them back.
