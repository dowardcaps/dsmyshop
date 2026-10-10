# Records page

`/records` replaces the separate Sales, GCash, Expenses and Debts list pages.

Layout: filter bar -> tabs (Sales / GCash / Expenses / Debts / Excess money) -> summary + table (8 rows per page).

## Filters
- Shared by every tab: **Search**, **From**, **To** (debts use the debt date).
- Per tab: Sales = Category + Payment, GCash = Type + Provider, Expenses = Category, Debts = Status.
- The URL is what the server reads (`/records?tab=gcash&q=abc&from=2026-02-01`), so links and the Back button work.
- The browser remembers the filters in localStorage (`dsfinance_record_filters_v1`). Opening Records with no filters in the URL
  brings the remembered ones (and the last tab) back. Filters in the URL win and are remembered.
- Code: `src/lib/records/filter-state.ts` (pure, tested), `filter-store.ts` (localStorage), `src/hooks/use-record-filters.ts`.

## Add / edit modals
Forms open in a modal driven by the URL: `?new=1` or `?edit=<id>`. Escape or Cancel removes the param; saving closes the modal and
refreshes the table. These links also work from the dashboard and from the sale/debt detail pages.

## Removed / redirected
- `/sales`, `/gcash`, `/expenses`, `/debts` redirect to `/records?tab=...` (query kept).
- `/sales/new`, `/gcash/new`, `/expenses/new`, `/debts/new` and every `/.../edit` page are gone (modals).
- Kept: `/sales/[id]`, `/debts/[id]` (line items / payments), `/expenses/categories`.

## Excess money tab
Cash overage: extra cash found versus what the records say. Fields: date, amount (> 0), notes. It is stored in its own table
(`ExcessMoney`). The **dashboard** shows an Excess Money card and adds it to Net Income (Net income = sales + GCash charges + excess − expenses; the monthly net chart includes it too). It is not counted as revenue, and the **Reports** page does not include it yet. Search (notes) and the date range apply like on
every other tab. Needs a migration: `npm run db:migrate -- --name add_excess_money`.

## Salary tab
Two employees (Doward and Sophia, ₱3,000 a month each, created automatically the first time the tab opens). The salary is paid twice a
month: the **15th** and the **30th** (last day of February), ₱1,500 each.

- Pay dates are generated automatically from the employee's start month (the month the tab was first opened) through the current month.
- **Cash advance / salary advance**: Add cash advance -> employee, the pay date to deduct from (their unpaid 15th/30th), amount, date given.
  An advance can never be more than what is left of that pay date.
- **Remaining balance** of a pay date = salary - advances. The cards show each employee's remaining balance (unpaid pay dates only),
  how much was deducted as advances, and how much was already paid out.
- **Mark paid** closes a pay date; its advances are locked until you press Undo.
- Salary is kept separate: it is not part of the dashboard net income or the reports.
- Tables: `Employee`, `SalaryPeriod`, `SalaryAdvance`. Migration: `npm run db:migrate -- --name add_salary`.
- Code: `src/lib/salary/` (calc, service, queries), `src/components/salary/`, `src/components/records/salary-panel.tsx`.

## Reimbursements tab
Money paid back to someone (an employee, the owner...) for a business cost. Fields: date, "Paid to / for what", amount (> 0), notes.
Add, edit and delete work like Excess money (modal, 8 rows per page, shared search and date filters; search also matches the description).

**Dashboard**: a Reimbursements card, and it is **subtracted** from Net Income:
Net income = sales + GCash charges + excess money − expenses − reimbursements (the monthly net chart includes it too).
The **Reports** page does not include excess money or reimbursements yet.
Needs a migration: `npm run db:migrate -- --name add_reimbursements`.
