import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isExemptFromAutoDeduct, stockLevel, type StockLevel } from "@/lib/inventory/stock";
import type { InventoryInput } from "@/lib/validation/inventory";
import type { InventoryFilters } from "@/lib/validation/inventory-filters";

export interface InventoryRow {
  id: string;
  name: string;
  quantity: number;
  lowLevel: number;
  highLevel: number;
  level: StockLevel;
  notes: string | null;
  serviceItemId: string | null;
  /** "Stationery · Ballpen", or null when stock is adjusted by hand only. */
  linkedService: string | null;
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

type ItemWithService = Prisma.InventoryItemGetPayload<{ include: { serviceItem: { select: { name: true; category: { select: { name: true } } } } } }>;

const toRow = (item: ItemWithService): InventoryRow => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  lowLevel: item.lowLevel,
  highLevel: item.highLevel,
  level: stockLevel(item.quantity, item.lowLevel, item.highLevel),
  notes: item.notes,
  serviceItemId: item.serviceItemId,
  linkedService: item.serviceItem ? `${item.serviceItem.category.name} · ${item.serviceItem.name}` : null,
});

const include = { serviceItem: { select: { name: true, category: { select: { name: true } } } } } as const;

/**
 * Inventory is small (a shop's stock list), so it is loaded once, then searched, filtered by level and
 * paged here. That keeps the Low / Medium / High rule in one place (`stockLevel`).
 */
export async function listInventory(userId: string, filters: InventoryFilters): Promise<InventoryListResult> {
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
  const item = await db.inventoryItem.findFirst({ where: { id, userId }, include });
  return item ? toRow(item) : null;
}

export function inventoryToFormValues(row: InventoryRow): InventoryInput {
  return {
    name: row.name,
    quantity: row.quantity,
    lowLevel: row.lowLevel,
    highLevel: row.highLevel,
    serviceItemId: row.serviceItemId ?? "",
    notes: row.notes ?? "",
  };
}

export interface LinkableService {
  id: string;
  label: string;
}

/**
 * Price-list items an inventory item can be linked to: not Printing / Xerox / bond paper (those are never
 * subtracted automatically), and not already linked to another item.
 */
export async function listLinkableServices(userId: string, currentItemId?: string): Promise<LinkableService[]> {
  const [services, taken] = await Promise.all([
    db.serviceItem.findMany({
      where: { userId },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, category: { select: { name: true } } },
    }),
    db.inventoryItem.findMany({ where: { userId, serviceItemId: { not: null }, ...(currentItemId ? { id: { not: currentItemId } } : {}) }, select: { serviceItemId: true } }),
  ]);
  const used = new Set(taken.map((item) => item.serviceItemId));
  return services
    .filter((service) => !used.has(service.id) && !isExemptFromAutoDeduct(service.category.name, service.name))
    .map((service) => ({ id: service.id, label: `${service.category.name} · ${service.name}` }));
}
