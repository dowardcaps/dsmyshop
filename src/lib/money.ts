import { Prisma } from "@/generated/prisma/client";

type MoneyInput = Prisma.Decimal | number | string;

const toDecimal = (value: MoneyInput): Prisma.Decimal => new Prisma.Decimal(value);

/** Rounds to 2 decimal places (half up), matching NUMERIC(12,2). */
export function roundMoney(value: MoneyInput): Prisma.Decimal {
  return toDecimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/** Line subtotal = quantity × unit price. Always calculate on the server. */
export function lineSubtotal(quantity: number, unitPrice: MoneyInput): Prisma.Decimal {
  return roundMoney(toDecimal(unitPrice).mul(quantity));
}

/** Sums money values without floating point error. */
export function sumMoney(values: readonly MoneyInput[]): Prisma.Decimal {
  return roundMoney(values.reduce<Prisma.Decimal>((total, v) => total.add(toDecimal(v)), new Prisma.Decimal(0)));
}

/** NUMERIC(12,2) value -> integer centavos (exact). */
export function decimalToCents(value: Prisma.Decimal): number {
  return value.mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}
