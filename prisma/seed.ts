import { config } from "dotenv";

import { createPrismaClient } from "../src/lib/db-client";
import { hashPassword } from "../src/lib/password";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_SALE_CATEGORIES } from "../src/lib/defaults";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const email = process.env.SEED_OWNER_EMAIL;
  if (!email) throw new Error("SEED_OWNER_EMAIL is not set");
  const name = process.env.SEED_OWNER_NAME ?? "Business Owner";

  const db = createPrismaClient(url);
  try {
    // Optional: re-running the seed with SEED_OWNER_PASSWORD set resets the owner's password.
    const password = process.env.SEED_OWNER_PASSWORD;
    if (password && password.length < 10) throw new Error("SEED_OWNER_PASSWORD must be at least 10 characters");
    const passwordHash = password ? await hashPassword(password) : undefined;

    const owner = await db.user.upsert({
      where: { email: email.toLowerCase() },
      update: passwordHash ? { passwordHash } : {},
      create: { email: email.toLowerCase(), name, passwordHash },
    });
    if (!owner.passwordHash) console.warn("Owner has no password yet. Set SEED_OWNER_PASSWORD and re-run the seed.");

    for (const categoryName of DEFAULT_SALE_CATEGORIES) {
      await db.saleCategory.upsert({
        where: { userId_name: { userId: owner.id, name: categoryName } },
        update: {},
        create: { userId: owner.id, name: categoryName },
      });
    }

    for (const categoryName of DEFAULT_EXPENSE_CATEGORIES) {
      await db.expenseCategory.upsert({
        where: { userId_name: { userId: owner.id, name: categoryName } },
        update: {},
        create: { userId: owner.id, name: categoryName },
      });
    }

    console.log(`Seeded owner ${owner.email} with default sale and expense categories.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
