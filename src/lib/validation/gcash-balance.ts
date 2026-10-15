import { z } from "zod";

import { moneyAmount } from "@/lib/validation/shared";

export const gcashBalanceSchema = z.object({
  balance: moneyAmount("Enter the balance shown in the GCash app"),
});

export type GcashBalanceInput = z.infer<typeof gcashBalanceSchema>;
