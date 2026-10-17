import type { GcashTransactionTypeValue } from "@/lib/gcash/constants";

/**
 * How a transaction moves the money in the GCash wallet (integer centavos):
 *  - Cash Out: the customer sends the amount to the shop's wallet, so the balance goes UP.
 *  - Cash In and Load: the shop sends the amount out of its wallet, so the balance goes DOWN.
 * The charge is the shop's cash income and does not touch the wallet.
 */
export function walletEffectCents(
  type: GcashTransactionTypeValue,
  amountCents: number,
): number {
  return type === "CASH_OUT" ? amountCents : -amountCents;
}

/** A sale paid with GCash puts its whole total into the wallet. No fee is taken off. Other payment methods do not touch it. */
export function saleWalletEffectCents(
  paymentMethod: string,
  totalCents: number,
): number {
  return paymentMethod === "GCASH" ? totalCents : 0;
}

/**
 * Wallet balance = the last typed-in balance + the effect of everything recorded since:
 * GCash transactions (Cash Out adds, Cash In and Load subtract) and the total of sales paid with GCash (adds).
 */
export function currentBalanceCents(
  checkpointCents: number,
  since: { type: GcashTransactionTypeValue; amountCents: number }[],
  gcashSalesCents = 0,
): number {
  return since.reduce(
    (balance, tx) => balance + walletEffectCents(tx.type, tx.amountCents),
    checkpointCents + gcashSalesCents,
  );
}
