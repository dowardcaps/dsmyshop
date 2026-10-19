# Transactions page (calculator)

Route: `/transactions` (price list: `/transactions/services`).

## How it works

1. Pick items and quantities. Each open customer is a tab; open carts live in this browser
   (localStorage) so a refresh does not lose them.
2. **Save to Sales** (or **Pay**, then **Save sale & clear**) sends only `{ serviceId, quantity }`
   plus date, payment method and customer name to the server.
3. The server looks up each service's name, category and price in the database, builds a normal
   `Sale` with `SaleItem` rows, recalculates every total, and revalidates `/sales`, `/dashboard`
   and `/reports`. The sale shows on the Sales page right away. Nothing is typed by hand.

Prices are never taken from the browser. Past sales keep their own copy of name and price, so
editing or deleting a service never changes them.

## Database

New table `ServiceItem` (price list). Apply it once:

```bash
npm run db:migrate -- --name add_service_catalog
```

The first visit to `/transactions` fills the table with the default list (it also creates the
Photo, Scan and Assistance sale categories if missing; "Laminate" maps to the existing
"Lamination" category). **Reset to defaults** on the services page restores the original list.

## Bulk edit (services & prices page)

Press **Bulk edit** to show checkboxes. Tick rows (shift-click selects a range; the header box
selects everything shown). A bar appears with **Edit selected** (change prices and/or move to
another category) and **Delete**. Price options: set to, increase/decrease by %, increase/decrease
by a peso amount, with a live before -> after preview. It is all-or-nothing: if one service would
drop below 0.01 or clash with a name in the target category, nothing is changed. Actions only
apply to rows currently shown, so searching first narrows what you change.

## Code map

- `src/lib/transactions/cart.ts` pure calculator logic (tabs, totals, summary text, Excel row)
- `src/lib/transactions/cart-store.ts` localStorage-backed store for the open tabs
- `src/lib/transactions/catalog.ts` price list queries and rules (server), incl. bulk edit/delete
- `src/lib/transactions/bulk.ts` price-change math shared by the preview and the server
- `src/lib/transactions/checkout.ts` cart -> Sale (server)
- `src/lib/actions/transactions.ts` server actions
- `src/hooks/use-transaction-cart.ts`, `use-checkout.ts`, `use-service-form.ts`
- `src/components/transactions/*`

## Category filter
Next to the search box there is a **category dropdown** ("All categories" plus every category in the price list). It combines with the search text, resets to page 1, and is remembered per transaction tab (saved with the cart). Items already added to the order stay in it while you switch categories. **Clear filters** resets both the search and the category; Reset order and saving a sale clear them too. Logic: `categoriesOf` / `filterServices` / `setCategory` in `src/lib/transactions/cart.ts`.

## Paid / Unpaid
Under Payment there is a **Paid | Unpaid** switch. It is **Paid** by default and goes back to Paid after every save.
- **Paid**: works as before (Pay / Save to Sales).
- **Unpaid** (customer took the service but has not paid): the button becomes **Save as unpaid**. The sale is saved with its transaction number but is **not counted anywhere**: dashboard, calendar daily earnings, reports, net income and the GCash balance all ignore it.
- Find unpaid sales in **Records > Sales** (Status column, "Status" filter, and an amber "₱X unpaid (N sales, not counted)" note). The green check button (or **Mark as paid** on the sale page) turns it into a normal paid sale. Editing a sale also has a Status field, so a paid sale can be set back to unpaid.
- A sale marked paid counts on its **own transaction date** (not the day it was paid). If that is an earlier month, that month's totals change; edit the sale's date first if you want it counted today.
- For the GCash balance, a sale paid by GCash is added when it becomes paid (and only if that is after the last balance you set).
- Data: `Sale.isPaid` (default true) and `Sale.paidAt`. Migration: `npm run db:migrate -- --name add_sale_paid_status`. Existing sales stay paid.
