import { z } from "zod";

import { dateString, moneyAmount } from "@/lib/validation/shared";

export const debtInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Max 120 characters"),
  description: z.string().trim().max(500, "Max 500 characters"),
  originalAmount: moneyAmount("Enter the amount").min(0.01, "Amount must be more than zero"),
  debtDate: dateString,
});

export const debtPaymentInputSchema = z.object({
  paymentDate: dateString,
  amount: moneyAmount("Enter the payment amount").min(0.01, "Amount must be more than zero"),
  notes: z.string().trim().max(500, "Max 500 characters"),
});

export type DebtInput = z.infer<typeof debtInputSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentInputSchema>;
