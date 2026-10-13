import Link from "next/link";
import { Boxes, Plus } from "lucide-react";

import { ImportStationeryButton } from "@/components/inventory/import-stationery-button";
import { InventoryFilterBar } from "@/components/inventory/inventory-filter-bar";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { StockBadge } from "@/components/inventory/stock-badge";
import { PageHeader } from "@/components/layout/page-header";
import { RecordDialog } from "@/components/records/record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { createInventoryHrefs } from "@/lib/inventory/href";
import { getInventoryItem, inventoryToFormValues, listInventory, listLinkableServices } from "@/lib/inventory/queries";
import { STOCK_LEVELS } from "@/lib/inventory/stock";
import { firstParam, type RawSearchParams } from "@/lib/validation/filter-utils";
import { hasActiveInventoryFilters, parseInventoryFilters } from "@/lib/validation/inventory-filters";

export const metadata = { title: "Inventory" };

const NEW_ITEM_DEFAULTS = { name: "", quantity: 0, lowLevel: 5, highLevel: 20, links: [], notes: "" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = parseInventoryFilters(params);
  const hrefs = createInventoryHrefs(params);
  const openNew = firstParam(params.new) === "1";
  const editId = firstParam(params.edit);

  const [result, editing] = await Promise.all([listInventory(user.id, filters), editId ? getInventoryItem(user.id, editId) : null]);
  const services = openNew || editing ? await listLinkableServices(user.id, editing?.id) : [];
  const filtered = hasActiveInventoryFilters(filters);
  const empty = result.counts.all === 0 && !filtered;

  const levelHref = (level: string) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (level) next.set("level", level);
    return next.toString() ? `/inventory?${next.toString()}` : "/inventory";
  };

  const addButton = (
    <Button asChild>
      <Link href={hrefs.addHref} scroll={false}>
        <Plus /> Add item
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock on hand. Sales from the Transactions page subtract linked stationery automatically. Printing, Xerox and bond paper are adjusted by hand."
        actions={
          <>
            <ImportStationeryButton />
            {addButton}
          </>
        }
      />

      <InventoryFilterBar filters={filters} />

      {empty ? (
        <EmptyState
          icon={Boxes}
          title="No inventory items yet"
          description="Add your first item, or bring in your stationery from the Transactions price list (stock starts at 0 and sales subtract from it)."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ImportStationeryButton />
              {addButton}
            </div>
          }
        />
      ) : (
        <>
          <section aria-label="Stock summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Link href={levelHref("")} className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <Card className="h-full gap-1 py-4" data-testid="inv-all">
                <CardContent>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">All items</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums" data-testid="inv-all-value">{result.counts.all.toLocaleString("en-PH")}</p>
                </CardContent>
              </Card>
            </Link>
            {STOCK_LEVELS.map((level) => (
              <Link key={level} href={levelHref(level)} className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <Card className="h-full gap-1 py-4" data-testid={`inv-${level}`}>
                  <CardContent>
                    <StockBadge level={level} />
                    <p className="mt-2 text-2xl font-semibold tabular-nums" data-testid={`inv-${level}-value`}>
                      {result.counts[level].toLocaleString("en-PH")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>

          {result.total === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No items match your filters"
              description="Try a different search or clear the filters."
              action={
                <Button asChild variant="outline">
                  <Link href={hrefs.clearHref}>Clear filters</Link>
                </Button>
              }
            />
          ) : (
            <>
              <InventoryTable rows={result.rows} editHref={hrefs.editHref} />
              <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={filters.pageSize} hrefForPage={hrefs.pageHref} />
            </>
          )}
        </>
      )}

      {openNew ? (
        <RecordDialog title="Add inventory item" description="Track how many you have left." closeHref={hrefs.closeHref}>
          <InventoryForm returnHref={hrefs.closeHref} defaultValues={NEW_ITEM_DEFAULTS} services={services} />
        </RecordDialog>
      ) : null}

      {editing ? (
        <RecordDialog title="Edit inventory item" description="Change the stock, the levels or the link to the price list." closeHref={hrefs.closeHref}>
          <InventoryForm defaultValues={inventoryToFormValues(editing)} itemId={editing.id} returnHref={hrefs.closeHref} services={services} />
        </RecordDialog>
      ) : null}
    </div>
  );
}
