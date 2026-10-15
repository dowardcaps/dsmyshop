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

/** Wallet balance = the last typed-in balance + the effect of everything recorded since. */
export function currentBalanceCents(
  checkpointCents: number,
  since: { type: GcashTransactionTypeValue; amountCents: number }[],
): number {
  return since.reduce(
    (balance, tx) => balance + walletEffectCents(tx.type, tx.amountCents),
    checkpointCents,
  );
}
