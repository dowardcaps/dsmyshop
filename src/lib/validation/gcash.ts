import { z } from "zod";

import { GCASH_PROVIDERS, GCASH_TRANSACTION_TYPES } from "@/lib/gcash/constants";
import { dateString, moneyAmount } from "@/lib/validation/shared";

export const gcashInputSchema = z
  .object({
    transactionDate: dateString,
    transactionType: z.enum(GCASH_TRANSACTION_TYPES),
    provider: z.enum(GCASH_PROVIDERS),
    amount: moneyAmount("Enter an amount").min(0.01, "Amount must be more than zero"),
    charge: moneyAmount("Enter the charge (0 if none)"),
    notes: z.string().trim().max(500, "Max 500 characters"),
  })
  .refine((value) => !(value.charge > value.amount), {
    path: ["charge"],
    message: "Charge cannot be more than the amount",
  });

export type GcashInput = z.infer<typeof gcashInputSchema>;
