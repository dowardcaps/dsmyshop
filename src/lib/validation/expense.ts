import { z } from "zod";

import { dateString, moneyAmount } from "@/lib/validation/shared";

export const expenseInputSchema = z.object({
  expenseDate: dateString,
  categoryId: z.string().min(1, "Select a category"),
  description: z.string().trim().min(1, "Description is required").max(200, "Max 200 characters"),
  amount: moneyAmount("Enter an amount").min(0.01, "Amount must be more than zero"),
  notes: z.string().trim().max(1000, "Max 1000 characters"),
});

export const expenseCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().trim().max(200, "Max 200 characters"),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategoryInputSchema>;
