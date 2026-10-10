import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { toCents } from "@/lib/cents";
import { db } from "@/lib/db";
import { parseDateInput, todayInManila } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import { formatPeso } from "@/lib/format";
import { decimalToCents } from "@/lib/money";
import { DEFAULT_EMPLOYEES } from "@/lib/salary/constants";
import { maxNewAdvanceCents, plannedPeriods } from "@/lib/salary/calc";
import type { AdvanceInput } from "@/lib/validation/salary";

export class SalaryServiceError extends ServiceError {}

type Tx = Prisma.TransactionClient;

const money = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
const NOT_FOUND = "Record not found.";

/**
 * Makes sure the default employees exist and every pay date from their start month through the
 * current month has a row. Safe to call on every page load (existing rows are skipped).
 */
export async function ensureSalaryPeriods(userId: string): Promise<void> {
  const currentMonth = todayInManila().slice(0, 7);

  const existing = await db.employee.count({ where: { userId } });
  if (existing === 0) {
    await db.employee.createMany({
      data: DEFAULT_EMPLOYEES.map((e) => ({
        userId,
        name: e.name,
        monthlySalary: new Prisma.Decimal(e.monthlySalary.toFixed(2)),
        startDate: parseDateInput(`${currentMonth}-01`),
      })),
      skipDuplicates: true,
    });
  }

  const employees = await db.employee.findMany({ where: { userId } });
  const data = employees.flatMap((employee) =>
    plannedPeriods(decimalToCents(employee.monthlySalary), employee.startDate.toISOString().slice(0, 7), currentMonth).map((period) => ({
      userId,
      employeeId: employee.id,
      payDate: parseDateInput(period.payDate),
      grossAmount: money(period.grossCents),
    })),
  );
  if (data.length > 0) await db.salaryPeriod.createMany({ data, skipDuplicates: true });
}

/** Locks a pay date row for the rest of the transaction so two advances can never both fit the same balance. */
async function lockPeriod(tx: Tx, userId: string, periodId: string) {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "SalaryPeriod" WHERE "id" = ${periodId} AND "userId" = ${userId} FOR UPDATE`;
  if (locked.length === 0) throw new SalaryServiceError(NOT_FOUND);
  return tx.salaryPeriod.findUniqueOrThrow({ where: { id: periodId } });
}

async function advancesCents(tx: Tx, periodId: string, exceptAdvanceId?: string): Promise<number> {
  const sum = await tx.salaryAdvance.aggregate({
    where: { periodId, ...(exceptAdvanceId ? { id: { not: exceptAdvanceId } } : {}) },
    _sum: { amount: true },
  });
  return decimalToCents(sum._sum.amount ?? new Prisma.Decimal(0));
}

const dateLabel = (date: Date) => date.toISOString().slice(0, 10);

async function assertCanDeduct(tx: Tx, period: { id: string; payDate: Date; grossAmount: Prisma.Decimal; paidOn: Date | null }, amountCents: number, exceptAdvanceId?: string) {
  if (period.paidOn) throw new SalaryServiceError(`The ${dateLabel(period.payDate)} salary is already paid. Mark it unpaid first to change advances.`);
  const gross = decimalToCents(period.grossAmount);
  const used = await advancesCents(tx, period.id, exceptAdvanceId);
  const room = maxNewAdvanceCents(gross, used);
  if (amountCents > room) {
    throw new SalaryServiceError(`Only ${formatPeso(room / 100)} of the ${formatPeso(gross / 100)} salary on ${dateLabel(period.payDate)} is left to advance.`);
  }
}

export async function createAdvance(userId: string, input: AdvanceInput): Promise<string> {
  return db.$transaction(async (tx) => {
    const period = await lockPeriod(tx, userId, input.periodId);
    if (period.employeeId !== input.employeeId) throw new SalaryServiceError("That pay date belongs to another employee.");
    await assertCanDeduct(tx, period, toCents(input.amount));
    const created = await tx.salaryAdvance.create({
      data: {
        userId,
        employeeId: period.employeeId,
        periodId: period.id,
        advanceDate: parseDateInput(input.advanceDate),
        amount: money(toCents(input.amount)),
        notes: input.notes || null,
      },
      select: { id: true },
    });
    return created.id;
  });
}

export async function updateAdvance(userId: string, advanceId: string, input: AdvanceInput): Promise<string> {
  return db.$transaction(async (tx) => {
    const current = await tx.salaryAdvance.findFirst({ where: { id: advanceId, userId } });
    if (!current) throw new SalaryServiceError(NOT_FOUND);

    // Lock in a fixed order (by id) when the advance moves to another pay date.
    const ids = [...new Set([current.periodId, input.periodId])].sort();
    const locked = new Map<string, Awaited<ReturnType<typeof lockPeriod>>>();
    for (const id of ids) locked.set(id, await lockPeriod(tx, userId, id));

    const oldPeriod = locked.get(current.periodId)!;
    if (oldPeriod.paidOn) throw new SalaryServiceError("That salary is already paid. Mark it unpaid first to change its advances.");
    const target = locked.get(input.periodId)!;
    if (target.employeeId !== input.employeeId) throw new SalaryServiceError("That pay date belongs to another employee.");
    await assertCanDeduct(tx, target, toCents(input.amount), target.id === current.periodId ? advanceId : undefined);

    await tx.salaryAdvance.update({
      where: { id: advanceId },
      data: {
        employeeId: target.employeeId,
        periodId: target.id,
        advanceDate: parseDateInput(input.advanceDate),
        amount: money(toCents(input.amount)),
        notes: input.notes || null,
      },
    });
    return advanceId;
  });
}

export async function deleteAdvance(userId: string, advanceId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const current = await tx.salaryAdvance.findFirst({ where: { id: advanceId, userId } });
    if (!current) throw new SalaryServiceError(NOT_FOUND);
    const period = await lockPeriod(tx, userId, current.periodId);
    if (period.paidOn) throw new SalaryServiceError("That salary is already paid. Mark it unpaid first to remove its advances.");
    await tx.salaryAdvance.delete({ where: { id: advanceId } });
  });
}

export async function markPeriodPaid(userId: string, periodId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const period = await lockPeriod(tx, userId, periodId);
    if (period.paidOn) throw new SalaryServiceError("Already marked as paid.");
    await tx.salaryPeriod.update({ where: { id: periodId }, data: { paidOn: parseDateInput(todayInManila()) } });
  });
}

export async function markPeriodUnpaid(userId: string, periodId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const period = await lockPeriod(tx, userId, periodId);
    if (!period.paidOn) throw new SalaryServiceError("Already marked as unpaid.");
    await tx.salaryPeriod.update({ where: { id: periodId }, data: { paidOn: null } });
  });
}
