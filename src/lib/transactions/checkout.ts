import "server-only";

import { db } from "@/lib/db";
import { createSale } from "@/lib/sales/service";
import { ServiceCatalogError } from "@/lib/transactions/catalog";
import type { SaleInput } from "@/lib/validation/sale";
import type { CheckoutInput } from "@/lib/validation/transaction";

export interface CheckoutResult {
  saleId: string;
  transactionNumber: string;
  totalAmount: number;
}

/**
 * Turns a calculator cart into a normal Sale. Names, categories and prices come from the
 * database price list, never from the browser, and the Sale service recalculates every total.
 */
export async function recordCheckout(userId: string, input: CheckoutInput): Promise<CheckoutResult> {
  // The same service twice in a cart becomes one line.
  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.serviceId, (quantities.get(item.serviceId) ?? 0) + item.quantity);

  const services = await db.serviceItem.findMany({
    where: { userId, id: { in: [...quantities.keys()] } },
    select: { id: true, name: true, price: true, categoryId: true },
  });
  if (services.length !== quantities.size) {
    throw new ServiceCatalogError("Some items were removed from your service list. Refresh the page and try again.");
  }

  const items: SaleInput["items"] = services.map((service) => ({
    categoryId: service.categoryId,
    description: service.name,
    quantity: quantities.get(service.id)!,
    unitPrice: service.price.toNumber(),
  }));

  const saleId = await createSale(userId, {
    transactionDate: input.transactionDate,
    customerName: input.customerName,
    paymentMethod: input.paymentMethod,
    notes: "",
    items,
  });

  const sale = await db.sale.findUniqueOrThrow({
    where: { id: saleId },
    select: { transactionNumber: true, totalAmount: true },
  });
  return { saleId, transactionNumber: sale.transactionNumber, totalAmount: sale.totalAmount.toNumber() };
}
