import { z } from "zod";

import { dateString, moneyAmount } from "@/lib/validation/shared";

export const reimbursementInputSchema = z
  .object({
    /** "From" of the covered period. */
    periodStart: dateString,
    /** "To" of the covered period; the day the amount counts in net income. */
    reimbursementDate: dateString,
    description: z
      .string()
      .trim()
      .min(1, "Enter who it was paid to or what it was for")
      .max(120, "Max 120 characters"),
    amount: moneyAmount("Enter an amount").min(
      0.01,
      "Amount must be more than zero",
    ),
    notes: z.string().trim().max(500, "Max 500 characters"),
  })
  .refine((v) => v.periodStart <= v.reimbursementDate, {
    path: ["periodStart"],
    message: "From must be on or before To",
  });

export type ReimbursementInput = z.infer<typeof reimbursementInputSchema>;
