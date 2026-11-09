import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { toCents } from "@/lib/cents";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import { decimalToCents } from "@/lib/money";
import {
  DEFAULT_FIXED_EXPENSES,
  DEFAULT_SETTINGS,
  type ExpenseKindValue,
} from "@/lib/performance/constants";
import { previousMonth } from "@/lib/performance/months";
import type {
  FixedExpenseInput,
  PerformanceSettingsInput,
} from "@/lib/validation/performance";

export class PerformanceServiceError extends ServiceError {}

const money = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
const monthStart = (ym: string) => parseDateInput(`${ym}-01`);

export interface PerformanceSettings {
  operatingDays: number;
  minDailyTargetCents: number;
  dailyTargetCents: number;
  growthTargetCents: number;
  /** Null = use the real cost share. */
  variableCostPct: number | null;
}

/** Creates the settings row (and the starting fixed costs) the first time the section is opened. */
export async function getSettings(
  userId: string,
): Promise<PerformanceSettings> {
  let row = await db.businessSettings.findUnique({ where: { userId } });
  if (!row) {
    await db.$transaction(async (tx) => {
      const created = await tx.businessSettings.createMany({
        data: [
          {
            userId,
            operatingDays: DEFAULT_SETTINGS.operatingDays,
            minDailyTarget: money(toCents(DEFAULT_SETTINGS.minDailyTarget)),
            dailyTarget: money(toCents(DEFAULT_SETTINGS.dailyTarget)),
            growthTarget: money(toCents(DEFAULT_SETTINGS.growthTarget)),
          },
        ],
        skipDuplicates: true,
      });
      if (created.count === 1) {
        await tx.fixedExpense.createMany({
          data: DEFAULT_FIXED_EXPENSES.map((e) => ({
            userId,
            name: e.name,
            amount: money(toCents(e.amount)),
            startMonth: parseDateInput("2000-01-01"),
          })),
        });
      }
    });
    row = await db.businessSettings.findUniqueOrThrow({ where: { userId } });
  }
  return {
    operatingDays: row.operatingDays,
    minDailyTargetCents: decimalToCents(row.minDailyTarget),
    dailyTargetCents: decimalToCents(row.dailyTarget),
    growthTargetCents: decimalToCents(row.growthTarget),
    variableCostPct: row.variableCostPct ? Number(row.variableCostPct) : null,
  };
}

export async function updateSettings(
  userId: string,
  input: PerformanceSettingsInput,
): Promise<void> {
  await getSettings(userId);
  await db.businessSettings.update({
    where: { userId },
    data: {
      operatingDays: input.operatingDays,
      minDailyTarget: money(toCents(input.minDailyTarget)),
      dailyTarget: money(toCents(input.dailyTarget)),
      growthTarget: money(toCents(input.growthTarget)),
      variableCostPct:
        input.variableCostPct === null
          ? null
          : new Prisma.Decimal(input.variableCostPct.toFixed(2)),
    },
  });
}

export async function addFixedExpense(
  userId: string,
  input: FixedExpenseInput,
): Promise<void> {
  await getSettings(userId);
  const clash = await db.fixedExpense.findFirst({
    where: {
      userId,
      name: { equals: input.name, mode: "insensitive" },
      endMonth: null,
    },
    select: { id: true },
  });
  if (clash)
    throw new PerformanceServiceError(
      "A fixed cost with that name already exists.",
    );
  await db.fixedExpense.create({
    data: {
      userId,
      name: input.name,
      amount: money(toCents(input.amount)),
      startMonth: monthStart(input.effectiveMonth),
    },
  });
}

/**
 * Changes an amount from a month onward. The old row is closed the month before and a new row starts, so earlier
 * months keep the amount that applied then. (If the old row started in that very month it is simply edited.)
 */
export async function changeFixedExpense(
  userId: string,
  id: string,
  input: FixedExpenseInput,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const current = await tx.fixedExpense.findFirst({
      where: { id, userId, endMonth: null },
    });
    if (!current) throw new PerformanceServiceError("Fixed cost not found.");
    const start = monthStart(input.effectiveMonth);
    const amount = money(toCents(input.amount));
    if (start <= current.startMonth) {
      await tx.fixedExpense.update({
        where: { id },
        data: { name: input.name, amount },
      });
      return;
    }
    await tx.fixedExpense.update({
      where: { id },
      data: { endMonth: monthStart(previousMonth(input.effectiveMonth)) },
    });
    await tx.fixedExpense.create({
      data: { userId, name: input.name, amount, startMonth: start },
    });
  });
}

/** Stops a fixed cost from a month onward (earlier months still include it). */
export async function endFixedExpense(
  userId: string,
  id: string,
  fromMonth: string,
): Promise<void> {
  const current = await db.fixedExpense.findFirst({
    where: { id, userId, endMonth: null },
  });
  if (!current) throw new PerformanceServiceError("Fixed cost not found.");
  const start = monthStart(fromMonth);
  if (start <= current.startMonth)
    await db.fixedExpense.delete({ where: { id } });
  else
    await db.fixedExpense.update({
      where: { id },
      data: { endMonth: monthStart(previousMonth(fromMonth)) },
    });
}

export async function setCategoryKind(
  userId: string,
  categoryId: string,
  kind: ExpenseKindValue,
): Promise<void> {
  const { count } = await db.expenseCategory.updateMany({
    where: { id: categoryId, userId },
    data: { kind },
  });
  if (count === 0) throw new PerformanceServiceError("Category not found.");
}
