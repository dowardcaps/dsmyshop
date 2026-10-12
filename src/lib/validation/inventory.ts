import { z } from "zod";

const wholeNumber = (message: string) =>
  z
    .number({ error: message })
    .int("Use a whole number")
    .min(0, "Cannot be negative")
    .max(1_000_000, "Too large");

export const inventoryInputSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the item name").max(80, "Max 80 characters"),
    quantity: wholeNumber("Enter the stock on hand"),
    lowLevel: wholeNumber("Enter the low-stock level"),
    highLevel: wholeNumber("Enter the high-stock level"),
    /** "" = not linked to the price list (stock is changed by hand only). */
    serviceItemId: z.string().trim().max(50),
    notes: z.string().trim().max(500, "Max 500 characters"),
  })
  .refine((value) => value.highLevel > value.lowLevel, {
    path: ["highLevel"],
    message: "High level must be more than the low level",
  });

export type InventoryInput = z.infer<typeof inventoryInputSchema>;
