import { z } from "zod";

import { SALARY_STATUSES } from "@/lib/salary/constants";
import { dateString, moneyAmount } from "@/lib/validation/shared";

export const advanceInputSchema = z.object({
  employeeId: z.string().min(1, "Choose an employee"),
  /** The pay date the advance is deducted from. */
  periodId: z.string().min(1, "Choose the pay date to deduct from"),
  advanceDate: dateString,
  amount: moneyAmount("Enter the amount").min(0.01, "Amount must be more than zero"),
  notes: z.string().trim().max(500, "Max 500 characters"),
});

export type AdvanceInput = z.infer<typeof advanceInputSchema>;

export { SALARY_STATUSES };
