import "server-only";

import { createPrismaClient } from "@/lib/db-client";
import { getServerEnv } from "@/lib/env";
import type { PrismaClient } from "@/generated/prisma/client";

// Reuse one client across hot reloads in development and across warm serverless invocations.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient(getServerEnv().DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
