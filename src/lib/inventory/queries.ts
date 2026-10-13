import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { migrateLegacyLinks } from "@/lib/inventory/service";
import { isExemptFromAutoDeduct, stockLevel, type StockLevel } from "@/lib/inventory/stock";
import type { InventoryInput } from "@/lib/validation/inventory";
import type { InventoryFilters } from "@/lib/validation/inventory-filters";

export interface InventoryLinkRow {
  serviceItemId: string;
  /** "Rush ID · P1 - 9pcs 1x1" */
  label: string;
  unitsPerSale: number;
}

export interface InventoryRow {
  id: string;
  name: string;
  quantity: number;
  lowLevel: number;
  highLevel: number;
  level: StockLevel;
  notes: string | null;
  /** The price-list items whose sales subtract from this stock. Empty = adjusted by hand only. */
  links: InventoryLinkRow[];
}

export interface InventoryListResult {
  rows: InventoryRow[];
  /** Matching the search and level filter. */
  total: number;
  page: number;
  pageCount: number;
  /** Counts for the summary cards: the whole inventory, or just the search when one is typed. */
  counts: Record<StockLevel, number> & { all: number };
}

const include = {
  links: {
    orderBy: { createdAt: "asc" },
    select: { serviceItemId: true, unitsPerSale: true, serviceItem: { select: { name: true, category: { select: { name: true } } } } },
  },
} as const satisfies Prisma.InventoryItemInclude;

type ItemWithLinks = Prisma.InventoryItemGetPayload<{ include: typeof include }>;

const toRow = (item: ItemWithLinks): InventoryRow => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  lowLevel: item.lowLevel,
  highLevel: item.highLevel,
  level: stockLevel(item.quantity, item.lowLevel, item.highLevel),
  notes: item.notes,
  links: item.links.map((link) => ({
    serviceItemId: link.serviceItemId,
    label: `${link.serviceItem.category.name} · ${link.serviceItem.name}`,
    unitsPerSale: link.unitsPerSale,
  })),
});

/**
 * Inventory is small (a shop's stock list), so it is loaded once, then searched, filtered by level and
 * paged here. That keeps the Low / Medium / High rule in one place (`stockLevel`).
 */
export async function listInventory(userId: string, filters: InventoryFilters): Promise<InventoryListResult> {
  await migrateLegacyLinks(userId);
  const items = await db.inventoryItem.findMany({
    where: {
      userId,
      ...(filters.q
        ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { notes: { contains: filters.q, mode: "insensitive" } }] }
        : {}),
    },
    include,
    orderBy: { name: "asc" },
  });

  const all = items.map(toRow);
  const counts = { all: all.length, low: 0, medium: 0, high: 0 };
  for (const row of all) counts[row.level] += 1;

  const matching = filters.level ? all.filter((row) => row.level === filters.level) : all;
  // Lowest stock first inside the list is handy, but alphabetical is predictable: keep A-Z.
  const pageCount = Math.max(1, Math.ceil(matching.length / filters.pageSize));
  const page = Math.min(filters.page, pageCount);
  const rows = matching.slice((page - 1) * filters.pageSize, page * filters.pageSize);

  return { rows, total: matching.length, page, pageCount, counts };
}

export async function getInventoryItem(userId: string, id: string): Promise<InventoryRow | null> {
  await migrateLegacyLinks(userId);
  const item = await db.inventoryItem.findFirst({ where: { id, userId }, include });
  return item ? toRow(item) : null;
}

export function inventoryToFormValues(row: InventoryRow): InventoryInput {
  return {
    name: row.name,
    quantity: row.quantity,
    lowLevel: row.lowLevel,
    highLevel: row.highLevel,
    links: row.links.map((link) => ({ serviceItemId: link.serviceItemId, unitsPerSale: link.unitsPerSale })),
    notes: row.notes ?? "",
  };
}

export interface LinkableService {
  id: string;
  label: string;
}

/**
 * Price-list items an inventory item may subtract on: not Printing / Xerox / bond paper (never subtracted
 * automatically), and not already used by ANOTHER inventory item (a sale would then subtract twice).
 * Items already linked to this one stay in the list so the form can show them.
 */
export async function listLinkableServices(userId: string, currentItemId?: string): Promise<LinkableService[]> {
  const [services, taken] = await Promise.all([
    db.serviceItem.findMany({
      where: { userId },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, category: { select: { name: true } } },
    }),
    db.inventoryLink.findMany({
      where: { inventoryItem: { userId }, ...(currentItemId ? { inventoryItemId: { not: currentItemId } } : {}) },
      select: { serviceItemId: true },
    }),
  ]);
  const used = new Set(taken.map((link) => link.serviceItemId));
  return services
    .filter((service) => !used.has(service.id) && !isExemptFromAutoDeduct(service.category.name, service.name))
    .map((service) => ({ id: service.id, label: `${service.category.name} · ${service.name}` }));
}
