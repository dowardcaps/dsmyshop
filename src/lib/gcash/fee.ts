/**
 * GCash fee table (Cash Out, and Cash In which charges the same), copied from the CHARGE formula in Sales.xlsx:
 * VLOOKUP(amount, {1,10; 501,10; 1001,15; 1501,20; ... ; 9501,100}, 2, TRUE).
 * Each row applies from its "from" amount up to just below the next row.
 */
export const GCASH_FEE_TIERS: readonly { from: number; fee: number }[] = [
  { from: 1, fee: 10 },
  { from: 501, fee: 10 },
  { from: 1001, fee: 15 },
  { from: 1501, fee: 20 },
  { from: 2001, fee: 25 },
  { from: 2501, fee: 30 },
  { from: 3001, fee: 35 },
  { from: 3501, fee: 40 },
  { from: 4001, fee: 45 },
  { from: 4501, fee: 50 },
  { from: 5001, fee: 55 },
  { from: 5501, fee: 60 },
  { from: 6001, fee: 65 },
  { from: 6501, fee: 70 },
  { from: 7001, fee: 75 },
  { from: 7501, fee: 80 },
  { from: 8001, fee: 85 },
  { from: 8501, fee: 90 },
  { from: 9001, fee: 95 },
  { from: 9501, fee: 100 },
];

/** The suggested Cash Out / Cash In fee for an amount, or null when the amount is below ₱1 (the sheet shows an error there). */
export function gcashFee(amount: number): number | null {
  if (!Number.isFinite(amount)) return null;
  const whole = Math.floor(amount);
  let fee: number | null = null;
  for (const tier of GCASH_FEE_TIERS) {
    if (whole >= tier.from) fee = tier.fee;
  }
  return fee;
}

/** Transaction types that get an automatic fee. Load charges stay manual. */
export const AUTO_FEE_TYPES: readonly string[] = ["CASH_OUT", "CASH_IN"];
