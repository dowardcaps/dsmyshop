import { config } from "dotenv";

import { createPrismaClient } from "../src/lib/db-client";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");

  const db = createPrismaClient(url);
  try {
    const [{ now }] = await db.$queryRaw<{ now: Date }[]>`SELECT NOW() AS now`;
    console.log(`Connected. Server time: ${now.toISOString()}`);

    const [users, saleCategories, expenseCategories, sales] = await Promise.all([
      db.user.count(),
      db.saleCategory.count(),
      db.expenseCategory.count(),
      db.sale.count(),
    ]);
    console.log({ users, saleCategories, expenseCategories, sales });
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("Database check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
