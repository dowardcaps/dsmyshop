# Pagination

Every table shows at most 8 rows per page (`TABLE_PAGE_SIZE` in `src/lib/pagination.ts`).

## Pieces
- `src/lib/pagination.ts` – pure helpers: `paginate`, `pageCountFor`, `pageRange`, `pageItems`.
- `src/hooks/use-pagination.ts` – `usePagination(rows, { resetKey })` for lists held in the browser.
- `src/components/shared/pagination-layout.tsx` – shared look ("Showing 1–8 of 97", page numbers with ellipsis, Prev/Next).
- `<Pagination>` – server pages. Links to `?page=N`; keeps other query params (search, filters). Hidden when there is one page.
- `<ClientPagination>` – client tables (service manager, calculator, sale items, payments, categories, monthly report). Buttons, no navigation.

## Adding a table
Server list: query with `skip/take = TABLE_PAGE_SIZE`, return the total, render `<Pagination page total pageSize />`.
Client list: `const p = usePagination(rows, { resetKey: search })`, render `p.rows` and `<ClientPagination {...p} onPageChange={p.setPage} />`.

Out-of-range `?page=` values are clamped to the last page. Bulk-edit selections persist across pages.
