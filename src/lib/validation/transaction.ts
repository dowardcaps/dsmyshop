import { z } from "zod";

import { MAX_ITEMS_PER_SALE, PAYMENT_METHODS } from "@/lib/sales/constants";
import { MAX_BULK_SERVICES } from "@/lib/transactions/bulk";
import { MAX_QUANTITY } from "@/lib/transactions/constants";
import { dateString, hasMaxTwoDecimals, MAX_MONEY, moneyAmount } from "@/lib/validation/shared";

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Max 200 characters"),
  categoryId: z.string().min(1, "Select a category"),
  price: moneyAmount("Enter a price").min(0.01, "Price must be more than 0"),
});

export const checkoutItemSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.number().int("Whole numbers only").min(1, "Minimum is 1").max(MAX_QUANTITY, "Too large"),
});

/** What the calculator sends when a transaction is saved. Prices are NOT sent: the server looks them up. */
export const checkoutInputSchema = z.object({
  transactionDate: dateString,
  customerName: z.string().trim().max(120, "Max 120 characters"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z
    .array(checkoutItemSchema)
    .min(1, "The cart is empty")
    .max(MAX_ITEMS_PER_SALE, `Max ${MAX_ITEMS_PER_SALE} different items per sale`),
});

const idList = z
  .array(z.string().min(1))
  .min(1, "Select at least one service")
  .max(MAX_BULK_SERVICES, `Max ${MAX_BULK_SERVICES} services at a time`);

export const priceChangeSchema = z
  .object({ mode: z.enum(["set", "percent", "amount"]), value: z.number({ error: "Enter a number" }).finite() })
  .superRefine((change, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", path: ["value"], message });
    if (!hasMaxTwoDecimals(change.value)) return fail("Max 2 decimal places");
    if (change.mode === "set" && (change.value < 0.01 || change.value > MAX_MONEY)) fail("Enter a price between ₱0.01 and ₱9,999,999.99");
    if (change.mode === "percent" && (change.value <= -100 || change.value > 1000)) fail("Percent must be between -99.99 and 1000");
    if (change.mode === "amount" && Math.abs(change.value) > MAX_MONEY) fail("Too large");
  });

/** Change the price and/or the category of many services at once. */
export const bulkEditSchema = z
  .object({
    ids: idList,
    priceChange: priceChangeSchema.optional(),
    categoryId: z.string().min(1).optional(),
  })
  .refine((input) => input.priceChange !== undefined || input.categoryId !== undefined, "Choose a price change or a category.");

export const bulkDeleteSchema = z.object({ ids: idList });

export type ServiceInput = z.infer<typeof serviceInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type BulkEditInput = z.infer<typeof bulkEditSchema>;
