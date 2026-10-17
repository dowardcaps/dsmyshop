import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { toCents } from "@/lib/cents";
import { db } from "@/lib/db";
import { decimalToCents } from "@/lib/money";
import { currentBalanceCents } from "@/lib/gcash/balance";
import type { GcashTransactionTypeValue } from "@/lib/gcash/constants";

export interface GcashBalanceSummary {
  /** False until the owner types in the balance from the GCash app once. */
  hasCheckpoint: boolean;
  balanceCents: number;
  checkpointCents: number;
  checkpointAt: Date | null;
  /** GCash transactions recorded since the checkpoint. */
  transactionsSince: number;
  /** Sales paid with GCash since the checkpoint, and their total. */
  gcashSalesSince: number;
  gcashSalesCents: number;
}

export async function getGcashBalance(
  userId: string,
): Promise<GcashBalanceSummary> {
  const checkpoint = await db.gcashBalanceCheck.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!checkpoint)
    return {
      hasCheckpoint: false,
      balanceCents: 0,
      checkpointCents: 0,
      checkpointAt: null,
      transactionsSince: 0,
      gcashSalesSince: 0,
      gcashSalesCents: 0,
    };

  const groups = await db.gcashTransaction.groupBy({
    by: ["transactionType"],
    where: { userId, createdAt: { gt: checkpoint.createdAt } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const sales = await db.sale.aggregate({
    where: {
      userId,
      paymentMethod: "GCASH",
      createdAt: { gt: checkpoint.createdAt },
    },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });
  const gcashSalesCents = sales._sum.totalAmount
    ? decimalToCents(sales._sum.totalAmount)
    : 0;
  const since = groups.map((g) => ({
    type: g.transactionType as GcashTransactionTypeValue,
    amountCents: g._sum.amount ? decimalToCents(g._sum.amount) : 0,
  }));
  const checkpointCents = decimalToCents(checkpoint.balance);
  return {
    hasCheckpoint: true,
    balanceCents: currentBalanceCents(checkpointCents, since, gcashSalesCents),
    checkpointCents,
    checkpointAt: checkpoint.createdAt,
    transactionsSince: groups.reduce((n, g) => n + g._count._all, 0),
    gcashSalesSince: sales._count._all,
    gcashSalesCents,
  };
}

/** Saves what the GCash app shows now. Returns how far off the system's own number was (null on the first time). */
export async function setGcashBalance(
  userId: string,
  balance: number,
): Promise<{ differenceCents: number | null }> {
  const before = await getGcashBalance(userId);
  const cents = toCents(balance);
  await db.gcashBalanceCheck.create({
    data: { userId, balance: new Prisma.Decimal((cents / 100).toFixed(2)) },
  });
  return {
    differenceCents: before.hasCheckpoint ? cents - before.balanceCents : null,
  };
}
