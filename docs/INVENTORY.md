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

An item can be linked to **one or many** price-list items ("Subtract when these are sold"). Each link has a
**Used per sale** number: how many of this stock one sale of that price-list item uses up.

Example: **3R Satin Photo Paper** linked to *Rush ID · P1 - 9pcs 1x1* (uses 1) and *Rush ID · P6 - 2pcs 2x2 & 4pcs 1x1*
(uses 1). Selling 2 x P1 and 1 x P6 takes 3 sheets out of stock. If P6 used 2 sheets, it would take 4.

A price-list item can feed only one inventory item (otherwise one sale would subtract twice), so items already
used by another inventory item are not offered in the dropdown.

**Never subtracted automatically** (adjust these by hand, because paper is also lost to printer trouble and misprints):

- everything in the **Printing** and **Xerox** categories
- any item whose name contains **bond paper** (e.g. "Bond Paper (A4) 20pcs.")

They cannot be picked in the link dropdown, and even a link that was set before an item was moved into Printing or
Xerox is ignored. You can still keep a manual inventory item for bond paper (no links).

Everything else (ballpen, glue, envelopes, folders, photo paper, Rush ID packages...) is subtracted when linked.

**Add stationery from price list** creates an item (stock 0, one link, uses 1) for every Stationery price-list item
that is not linked yet, skipping bond paper. Then just type the real stock in each one.

## Rules worth knowing

- Stock never goes below 0, and a sale is never blocked because stock ran out.
- If the inventory update fails after a sale was saved, the sale stays saved (the error is logged).
- Deleting or editing a **sale** does not give stock back. Fix the stock in the inventory item.
- "Reset to defaults" on the price list recreates the services; every link and its "used per sale" is restored by name.
- Deleting a price-list item keeps the inventory item but removes that link.
- Item names are unique, ignoring upper/lower case.

## Database

New tables `InventoryItem` and `InventoryLink`. Apply once:

```bash
npm run db:migrate -- --name add_inventory
```

If you already ran `add_inventory` with the first version (one link per item), run
`npm run db:migrate -- --name inventory_many_links`. Existing single links are copied into the new links table
automatically the first time the Inventory page or a sale touches them (the old `serviceItemId` column is then
cleared; it can be dropped in a later migration).

## Code map

- `src/lib/inventory/stock.ts` pure rules (levels, exemptions)
- `src/lib/inventory/queries.ts`, `service.ts` list/search/paging, CRUD, links, import, deduct-at-sale (server)
- `src/lib/transactions/checkout.ts` calls `deductStockForSale` after the sale is saved
- `src/lib/actions/inventory.ts`, `src/hooks/use-inventory-form.ts`
- `src/components/inventory/*`, `src/app/(app)/inventory/page.tsx`
