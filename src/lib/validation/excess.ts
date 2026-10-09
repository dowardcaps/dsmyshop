import { z } from "zod";

import { dateString, moneyAmount } from "@/lib/validation/shared";

export const excessInputSchema = z.object({
  excessDate: dateString,
  amount: moneyAmount("Enter an amount").min(0.01, "Amount must be more than zero"),
  notes: z.string().trim().max(500, "Max 500 characters"),
});

export type ExcessInput = z.infer<typeof excessInputSchema>;
