import { z } from "zod";

const wholeNumber = (message: string) =>
  z
    .number({ error: message })
    .int("Use a whole number")
    .min(0, "Cannot be negative")
    .max(1_000_000, "Too large");

export const inventoryLinkSchema = z.object({
  serviceItemId: z.string().trim().min(1, "Choose an item").max(50),
  /** How many of this stock one sale of the price-list item uses up. */
  unitsPerSale: z
    .number({ error: "Enter how many it uses" })
    .int("Use a whole number")
    .min(1, "At least 1")
    .max(1000, "Too large"),
});

export type InventoryLinkInput = z.infer<typeof inventoryLinkSchema>;

export const inventoryInputSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the item name").max(80, "Max 80 characters"),
    quantity: wholeNumber("Enter the stock on hand"),
    lowLevel: wholeNumber("Enter the low-stock level"),
    highLevel: wholeNumber("Enter the high-stock level"),
    /** Price-list items whose sales subtract from this stock. Empty = stock is changed by hand only. */
    links: z.array(inventoryLinkSchema).max(30, "Too many linked items"),
    notes: z.string().trim().max(500, "Max 500 characters"),
  })
  .refine((value) => value.highLevel > value.lowLevel, {
    path: ["highLevel"],
    message: "High level must be more than the low level",
  })
  .refine((value) => new Set(value.links.map((link) => link.serviceItemId)).size === value.links.length, {
    path: ["links"],
    message: "Each price-list item can only be added once",
  });

export type InventoryInput = z.infer<typeof inventoryInputSchema>;
