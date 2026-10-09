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
