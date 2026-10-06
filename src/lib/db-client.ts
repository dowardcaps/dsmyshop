import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * node-postgres treats sslmode=prefer|require|verify-ca as "verify-full" today and warns that
 * this will change in the next major version. Writing "verify-full" explicitly keeps exactly the
 * same (secure) behaviour and silences the warning. Other URLs are left untouched.
 */
export function normalizeSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (url.searchParams.has("uselibpqcompat") || !mode || !["prefer", "require", "verify-ca"].includes(mode)) {
      return connectionString;
    }
    url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Creates a PrismaClient backed by the node-postgres driver adapter.
 * Kept free of `server-only` so scripts (seed, db:check) can reuse it.
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: normalizeSslMode(connectionString) });
  return new PrismaClient({ adapter });
}
