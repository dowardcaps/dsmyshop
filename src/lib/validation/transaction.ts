import { z } from "zod";

import { MAX_ITEMS_PER_SALE, PAYMENT_METHODS } from "@/lib/sales/constants";
import { MAX_QUANTITY } from "@/lib/transactions/constants";
import { dateString, moneyAmount } from "@/lib/validation/shared";

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

export type ServiceInput = z.infer<typeof serviceInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
