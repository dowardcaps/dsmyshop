import { z } from "zod";

import { MAX_ITEMS_PER_SALE, PAYMENT_METHODS } from "@/lib/sales/constants";
import { dateString, moneyAmount } from "@/lib/validation/shared";

export const saleItemSchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  description: z.string().trim().min(1, "Description is required").max(200, "Max 200 characters"),
  quantity: z
    .number({ error: "Enter a quantity" })
    .int("Whole numbers only")
    .min(1, "Minimum is 1")
    .max(100_000, "Too large"),
  unitPrice: moneyAmount("Enter a price"),
});

export const saleInputSchema = z.object({
  transactionDate: dateString,
  customerName: z.string().trim().max(120, "Max 120 characters"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().trim().max(1000, "Max 1000 characters"),
  items: z
    .array(saleItemSchema)
    .min(1, "Add at least one item")
    .max(MAX_ITEMS_PER_SALE, `Max ${MAX_ITEMS_PER_SALE} items per sale`),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type SaleInput = z.infer<typeof saleInputSchema>;
