import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { toCents } from "@/lib/cents";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import { decimalToCents } from "@/lib/money";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ensureSalaryPeriods } from "@/lib/salary/service";
import { splitMonthlySalaryCents } from "@/lib/salary/calc";
import type { EmployeeInput, PasswordInput, ProfileInput } from "@/lib/validation/settings";

export class SettingsServiceError extends ServiceError {}

const money = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
const isUnique = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function getAccount(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } });
  return user;
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { name: input.name } });
}

export async function changePassword(userId: string, input: PasswordInput): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  if (!user.passwordHash || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new SettingsServiceError("Your current password is incorrect.");
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } });
}

export interface EmployeeRow {
  id: string;
  name: string;
  monthlySalaryCents: number;
  startMonth: string;
  paidPeriods: number;
  advances: number;
}

export async function listEmployees(userId: string): Promise<EmployeeRow[]> {
  await ensureSalaryPeriods(userId); // seeds the default employees on first visit
  const employees = await db.employee.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { advances: true } }, periods: { where: { paidOn: { not: null } }, select: { id: true } } },
  });
  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    monthlySalaryCents: decimalToCents(e.monthlySalary),
    startMonth: e.startDate.toISOString().slice(0, 7),
    paidPeriods: e.periods.length,
    advances: e._count.advances,
  }));
}

export async function createEmployee(userId: string, input: EmployeeInput): Promise<void> {
  try {
    await db.employee.create({
      data: {
        userId,
        name: input.name,
        monthlySalary: money(toCents(input.monthlySalary)),
        startDate: parseDateInput(`${input.startMonth}-01`),
      },
    });
  } catch (error) {
    if (isUnique(error)) throw new SettingsServiceError("An employee with that name already exists.");
    throw error;
  }
  await ensureSalaryPeriods(userId);
}

/**
 * Renames / re-prices an employee. A new salary only reaches pay dates that are still unpaid and
 * have no advances; paid and advanced pay dates keep the amount they were created with.
 */
export async function updateEmployee(userId: string, id: string, input: EmployeeInput): Promise<void> {
  await db.$transaction(async (tx) => {
    const current = await tx.employee.findFirst({ where: { id, userId } });
    if (!current) throw new SettingsServiceError("Employee not found.");
    try {
      await tx.employee.update({ where: { id }, data: { name: input.name, monthlySalary: money(toCents(input.monthlySalary)) } });
    } catch (error) {
      if (isUnique(error)) throw new SettingsServiceError("An employee with that name already exists.");
      throw error;
    }

    const cents = toCents(input.monthlySalary);
    if (cents === decimalToCents(current.monthlySalary)) return;
    const [firstHalf, secondHalf] = splitMonthlySalaryCents(cents);
    const periods = await tx.salaryPeriod.findMany({
      where: { employeeId: id, userId, paidOn: null, advances: { none: {} } },
      select: { id: true, payDate: true },
    });
    for (const period of periods) {
      // The first pay date of a month is the 15th; anything later is the second half.
      const gross = period.payDate.getUTCDate() <= 15 ? firstHalf : secondHalf;
      await tx.salaryPeriod.update({ where: { id: period.id }, data: { grossAmount: money(gross) } });
    }
  });
}

export async function deleteEmployee(userId: string, id: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const employee = await tx.employee.findFirst({
      where: { id, userId },
      include: { _count: { select: { advances: true } }, periods: { where: { paidOn: { not: null } }, select: { id: true } } },
    });
    if (!employee) throw new SettingsServiceError("Employee not found.");
    if ((await tx.employee.count({ where: { userId } })) <= 1) throw new SettingsServiceError("Keep at least one employee.");
    if (employee.periods.length > 0 || employee._count.advances > 0) {
      throw new SettingsServiceError("This employee already has paid salaries or advances, so it can't be deleted.");
    }
    await tx.employee.delete({ where: { id } });
  });
}
