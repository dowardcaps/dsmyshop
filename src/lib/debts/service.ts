import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { toCents } from "@/lib/cents";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { debtBalanceCents, debtStatusFromCents } from "@/lib/debts/calc";
import { ServiceError } from "@/lib/errors";
import { formatPeso } from "@/lib/format";
import { decimalToCents } from "@/lib/money";
import type { DebtInput, DebtPaymentInput } from "@/lib/validation/debt";

export class DebtServiceError extends ServiceError {}

type Tx = Prisma.TransactionClient;

const money = (value: number) => new Prisma.Decimal(value.toFixed(2));
const NOT_FOUND = "Debt not found.";

/**
 * Locks the debt row for the rest of the transaction (SELECT ... FOR UPDATE) and returns it.
 * Every payment/balance change goes through here, so two requests can never both pass the
 * "payment <= balance" check against the same stale total.
 */
async function lockDebt(tx: Tx, userId: string, debtId: string) {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Debt" WHERE "id" = ${debtId} AND "userId" = ${userId} FOR UPDATE`;
  if (locked.length === 0) throw new DebtServiceError(NOT_FOUND);
  return tx.debt.findUniqueOrThrow({ where: { id: debtId } });
}

async function totalPaidCents(tx: Tx, debtId: string, exceptPaymentId?: string): Promise<number> {
  const aggregate = await tx.debtPayment.aggregate({
    where: { debtId, ...(exceptPaymentId ? { id: { not: exceptPaymentId } } : {}) },
    _sum: { amount: true },
  });
  return decimalToCents(aggregate._sum.amount ?? new Prisma.Decimal(0));
}

/** Recomputes and stores the status from the actual payments. */
async function syncStatus(tx: Tx, debtId: string, originalCents: number) {
  const paid = await totalPaidCents(tx, debtId);
  await tx.debt.update({ where: { id: debtId }, data: { status: debtStatusFromCents(originalCents, paid) } });
}

export async function createDebt(userId: string, input: DebtInput): Promise<string> {
  const created = await db.debt.create({
    data: {
      userId,
      name: input.name,
      description: input.description || null,
      originalAmount: money(input.originalAmount),
      debtDate: parseDateInput(input.debtDate),
      status: "UNPAID",
    },
    select: { id: true },
  });
  return created.id;
}

export async function updateDebt(userId: string, debtId: string, input: DebtInput): Promise<string> {
  return db.$transaction(async (tx) => {
    await lockDebt(tx, userId, debtId);
    const paid = await totalPaidCents(tx, debtId);
    const newOriginal = toCents(input.originalAmount);
    if (newOriginal < paid) {
      throw new DebtServiceError(`The amount cannot be less than the ${formatPeso(paid / 100)} already paid.`);
    }
    await tx.debt.update({
      where: { id: debtId },
      data: {
        name: input.name,
        description: input.description || null,
        originalAmount: money(input.originalAmount),
        debtDate: parseDateInput(input.debtDate),
        status: debtStatusFromCents(newOriginal, paid),
      },
    });
    return debtId;
  });
}

/** A debt with payments keeps its history: delete (or reassign) the payments first. */
export async function deleteDebt(userId: string, debtId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await lockDebt(tx, userId, debtId);
    const payments = await tx.debtPayment.count({ where: { debtId } });
    if (payments > 0) {
      throw new DebtServiceError(
        `This debt has ${payments === 1 ? "1 payment" : `${payments} payments`} recorded. Delete the payments first, or keep the debt as a record.`,
      );
    }
    await tx.debt.delete({ where: { id: debtId } });
  });
}

export async function recordPayment(userId: string, debtId: string, input: DebtPaymentInput): Promise<string> {
  return db.$transaction(async (tx) => {
    const debt = await lockDebt(tx, userId, debtId);
    const original = decimalToCents(debt.originalAmount);
    const balance = debtBalanceCents(original, await totalPaidCents(tx, debtId));

    if (balance === 0) throw new DebtServiceError("This debt is already fully paid.");
    if (toCents(input.amount) > balance) {
      throw new DebtServiceError(`The payment is more than the remaining balance of ${formatPeso(balance / 100)}.`);
    }

    const payment = await tx.debtPayment.create({
      data: { debtId, paymentDate: parseDateInput(input.paymentDate), amount: money(input.amount), notes: input.notes || null },
      select: { id: true },
    });
    await syncStatus(tx, debtId, original);
    return payment.id;
  });
}

export async function updatePayment(
  userId: string,
  debtId: string,
  paymentId: string,
  input: DebtPaymentInput,
): Promise<string> {
  return db.$transaction(async (tx) => {
    const debt = await lockDebt(tx, userId, debtId);
    const existing = await tx.debtPayment.findFirst({ where: { id: paymentId, debtId }, select: { id: true } });
    if (!existing) throw new DebtServiceError("Payment not found.");

    const original = decimalToCents(debt.originalAmount);
    const balanceWithoutThis = debtBalanceCents(original, await totalPaidCents(tx, debtId, paymentId));
    if (toCents(input.amount) > balanceWithoutThis) {
      throw new DebtServiceError(`The payment is more than the remaining balance of ${formatPeso(balanceWithoutThis / 100)}.`);
    }

    await tx.debtPayment.update({
      where: { id: paymentId },
      data: { paymentDate: parseDateInput(input.paymentDate), amount: money(input.amount), notes: input.notes || null },
    });
    await syncStatus(tx, debtId, original);
    return paymentId;
  });
}

export async function deletePayment(userId: string, debtId: string, paymentId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const debt = await lockDebt(tx, userId, debtId);
    const { count } = await tx.debtPayment.deleteMany({ where: { id: paymentId, debtId } });
    if (count === 0) throw new DebtServiceError("Payment not found.");
    await syncStatus(tx, debtId, decimalToCents(debt.originalAmount));
  });
}
