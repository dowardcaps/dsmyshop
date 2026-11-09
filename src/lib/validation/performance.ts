import { z } from "zod";

import { moneyAmount } from "@/lib/validation/shared";

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a month");

export const performanceSettingsSchema = z
  .object({
    operatingDays: z
      .number({ error: "Enter the operating days" })
      .int("Whole days only")
      .min(1, "At least 1")
      .max(31, "Max 31"),
    minDailyTarget: moneyAmount("Enter the minimum target"),
    dailyTarget: moneyAmount("Enter the daily target").min(
      0.01,
      "Must be more than 0",
    ),
    growthTarget: moneyAmount("Enter the growth target"),
    /** Empty = use the real cost share from your records. */
    variableCostPct: z
      .number()
      .min(0, "0 or more")
      .max(99.99, "Below 100")
      .nullable(),
  })
  .refine((v) => v.minDailyTarget <= v.dailyTarget, {
    path: ["minDailyTarget"],
    message: "Must not be above the daily target",
  })
  .refine((v) => v.dailyTarget <= v.growthTarget, {
    path: ["growthTarget"],
    message: "Must not be below the daily target",
  });

export const fixedExpenseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Max 60 characters"),
  amount: moneyAmount("Enter the monthly amount").min(
    0.01,
    "Must be more than 0",
  ),
  /** The first month the amount applies to. Earlier months keep their old amount. */
  effectiveMonth: month,
});

export const monthParamSchema = month;

export type PerformanceSettingsInput = z.infer<
  typeof performanceSettingsSchema
>;
export type FixedExpenseInput = z.infer<typeof fixedExpenseSchema>;
