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
(`ExcessMoney`) and is **not** included in sales income, the dashboard or the reports. Search (notes) and the date range apply like on
every other tab. Needs a migration: `npm run db:migrate -- --name add_excess_money`.
