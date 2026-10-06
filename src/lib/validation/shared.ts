import { z } from "zod";

import { isValidDateInput } from "@/lib/dates";

/** A real calendar date written as YYYY-MM-DD. */
export const dateString = z.string().refine(isValidDateInput, "Enter a valid date");

export const MAX_MONEY = 9_999_999.99;

export const hasMaxTwoDecimals = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

/** Money amount: finite, 0..MAX_MONEY, at most 2 decimals. Use `.min()` to tighten. */
export const moneyAmount = (requiredMessage: string) =>
  z
    .number({ error: requiredMessage })
    .min(0, "Cannot be negative")
    .max(MAX_MONEY, "Too large")
    .refine(hasMaxTwoDecimals, "Max 2 decimal places");
