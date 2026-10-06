import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { PaymentMethodValue } from "@/lib/sales/constants";
import type { SaleInput } from "@/lib/validation/sale";
import type { SaleFilters } from "@/lib/validation/sale-filters";

export interface SaleCategoryOption {
  id: string;
  name: string;
}

export interface SaleListRow {
  id: string;
  transactionNumber: string;
  transactionDate: Date;
  customerName: string | null;
  paymentMethod: PaymentMethodValue;
  totalAmount: number;
  itemCount: number;
  categories: string[];
}

export interface SaleListResult {
  rows: SaleListRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageCount: number;
}

export interface SaleDetail {
  id: string;
  transactionNumber: string;
  transactionDate: Date;
  customerName: string | null;
  paymentMethod: PaymentMethodValue;
  notes: string | null;
  totalAmount: number;
  items: {
    id: string;
    categoryId: string;
    categoryName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export async function listSaleCategories(userId: string): Promise<SaleCategoryOption[]> {
  return db.saleCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

function buildWhere(userId: string, filters: SaleFilters): Prisma.SaleWhereInput {
  const { q, from, to, categoryId, paymentMethod } = filters;
  return {
    userId,
    ...(from || to
      ? {
          transactionDate: {
            ...(from ? { gte: parseDateInput(from) } : {}),
            ...(to ? { lte: parseDateInput(to) } : {}),
          },
        }
      : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(categoryId ? { items: { some: { categoryId } } } : {}),
    ...(q
      ? {
          OR: [
            { transactionNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
            { items: { some: { description: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
}

export async function listSales(userId: string, filters: SaleFilters): Promise<SaleListResult> {
  const where = buildWhere(userId, filters);
  const { pageSize } = filters;

  const [total, aggregate] = await Promise.all([
    db.sale.count({ where }),
    db.sale.aggregate({ where, _sum: { totalAmount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, pageCount);

  const sales = await db.sale.findMany({
    where,
    orderBy: [{ transactionDate: "desc" }, { transactionNumber: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { items: { select: { category: { select: { name: true } } } } },
  });

  return {
    rows: sales.map((sale) => ({
      id: sale.id,
      transactionNumber: sale.transactionNumber,
      transactionDate: sale.transactionDate,
      customerName: sale.customerName,
      paymentMethod: sale.paymentMethod,
      totalAmount: sale.totalAmount.toNumber(),
      itemCount: sale.items.length,
      categories: [...new Set(sale.items.map((item) => item.category.name))],
    })),
    total,
    totalAmount: aggregate._sum.totalAmount?.toNumber() ?? 0,
    page,
    pageCount,
  };
}

export async function getSale(userId: string, saleId: string): Promise<SaleDetail | null> {
  const sale = await db.sale.findFirst({
    where: { id: saleId, userId },
    include: {
      items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { category: { select: { name: true } } } },
    },
  });
  if (!sale) return null;

  return {
    id: sale.id,
    transactionNumber: sale.transactionNumber,
    transactionDate: sale.transactionDate,
    customerName: sale.customerName,
    paymentMethod: sale.paymentMethod,
    notes: sale.notes,
    totalAmount: sale.totalAmount.toNumber(),
    items: sale.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      subtotal: item.subtotal.toNumber(),
    })),
  };
}

/** Maps a stored sale to the edit form's values. */
export function saleToFormValues(sale: SaleDetail): SaleInput {
  return {
    transactionDate: toDateInputValue(sale.transactionDate),
    customerName: sale.customerName ?? "",
    paymentMethod: sale.paymentMethod,
    notes: sale.notes ?? "",
    items: sale.items.map(({ categoryId, description, quantity, unitPrice }) => ({
      categoryId,
      description,
      quantity,
      unitPrice,
    })),
  };
}
