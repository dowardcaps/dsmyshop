import { z } from "zod";

import { dateString, moneyAmount } from "@/lib/validation/shared";

export const reimbursementInputSchema = z.object({
  reimbursementDate: dateString,
  description: z.string().trim().min(1, "Enter who it was paid to or what it was for").max(120, "Max 120 characters"),
  amount: moneyAmount("Enter an amount").min(0.01, "Amount must be more than zero"),
  notes: z.string().trim().max(500, "Max 500 characters"),
});

export type ReimbursementInput = z.infer<typeof reimbursementInputSchema>;
