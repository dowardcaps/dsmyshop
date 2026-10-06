/** Money in integer centavos, so arithmetic never drifts. */

export const toCents = (amount: number): number => Math.round(amount * 100);

/** Centavos -> "1234.50", the format accepted by NUMERIC(12,2). */
export const centsToDecimalString = (cents: number): string => (cents / 100).toFixed(2);

export const centsToAmount = (cents: number): number => cents / 100;
