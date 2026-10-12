# Inventory

Route: `/inventory` (sidebar: **Inventory**). It only tracks **stock on hand**, nothing else.

## The table

- Search by item name or notes, filter by stock level, 8 rows per page.
- **Add item** / the pencil icon open a modal (`?new=1`, `?edit=ID`). The trash icon deletes (with a confirmation).
- Each item has `In stock`, `Low at or below` and `High at or above`:
  - **Low** (red): stock is at or below the low level.
  - **High** (green): stock is at or above the high level.
  - **Medium** (amber): anything in between.
- The four cards on top count items per level; click one to filter by it.

## Link with the Transactions calculator

Every item can be linked to one price-list item ("Subtract when this is sold"). When a sale is saved from the
Transactions page, the quantity sold is subtracted from the linked item.

**Never subtracted automatically** (adjust these by hand, because paper is also lost to printer trouble and misprints):

- everything in the **Printing** and **Xerox** categories
- any item whose name contains **bond paper** (e.g. "Bond Paper (A4) 20pcs.")

They cannot be picked in the link dropdown, and even a link that was set before an item was moved into Printing or
Xerox is ignored. You can still keep a manual inventory item for bond paper ("Not linked").

Everything else (ballpen, glue, envelopes, folders, photo paper...) is subtracted when linked.

**Add stationery from price list** creates an item (stock 0, linked) for every Stationery price-list item that does not
have one yet, skipping bond paper. Then just type the real stock in each one.

## Rules worth knowing

- Stock never goes below 0, and a sale is never blocked because stock ran out.
- If the inventory update fails after a sale was saved, the sale stays saved (the error is logged).
- Deleting or editing a **sale** does not give stock back. Fix the stock in the inventory item.
- "Reset to defaults" on the price list recreates the services; the inventory links are restored by name.
- Deleting a price-list item keeps the inventory item but unlinks it.
- Item names are unique, ignoring upper/lower case.

## Database

New table `InventoryItem`. Apply it once:

```bash
npm run db:migrate -- --name add_inventory
```

## Code map

- `src/lib/inventory/stock.ts` pure rules (levels, exemptions)
- `src/lib/inventory/queries.ts`, `service.ts` list/search/paging, CRUD, import, deduct-at-sale (server)
- `src/lib/transactions/checkout.ts` calls `deductStockForSale` after the sale is saved
- `src/lib/actions/inventory.ts`, `src/hooks/use-inventory-form.ts`
- `src/components/inventory/*`, `src/app/(app)/inventory/page.tsx`
