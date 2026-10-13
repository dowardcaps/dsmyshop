import { z } from "zod";

import { moneyAmount } from "@/lib/validation/shared";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80, "Max 80 characters"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: z.string().min(8, "Use at least 8 characters").max(200, "Max 200 characters"),
    confirmPassword: z.string().min(1, "Repeat the new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a different password" });
export type PasswordInput = z.infer<typeof passwordSchema>;

export const employeeInputSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(60, "Max 60 characters"),
  monthlySalary: moneyAmount("Enter the monthly salary").min(0.01, "Salary must be more than zero"),
  /** YYYY-MM, the first month with pay dates. Only used when adding an employee. */
  startMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a month"),
});
export type EmployeeInput = z.infer<typeof employeeInputSchema>;
