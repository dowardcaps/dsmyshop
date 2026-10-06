import { isValidDateInput } from "@/lib/dates";

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** First non-empty trimmed value of a search param. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

export function parseDateParam(value: string | string[] | undefined): string | undefined {
  const date = firstParam(value);
  return date && isValidDateInput(date) ? date : undefined;
}

export function parsePageParam(value: string | string[] | undefined): number {
  const page = Number.parseInt(firstParam(value) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** Returns the matching allowed value, or undefined. */
export function parseEnumParam<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  const raw = firstParam(value);
  return allowed.find((item) => item === raw);
}
