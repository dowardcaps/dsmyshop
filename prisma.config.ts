import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js convention first (.env.local), then plain .env.
config({ path: ".env.local" });
config();

/** First variable that is set to a non-empty value (an empty "" must not win). */
function firstNonEmpty(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

// Migrations need a DIRECT (non-pooled) connection. The Vercel + Neon integration sets
// DATABASE_URL_UNPOOLED (and POSTGRES_URL_NON_POOLING). Falls back to the pooled URL.
const url = firstNonEmpty(
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_URL",
);

if (!url && process.argv.some((arg) => arg.startsWith("migrate") || arg === "db")) {
  console.error(
    "\nNo database URL found. Set DATABASE_URL_UNPOOLED (or DIRECT_URL / DATABASE_URL) in .env.local.\n" +
      "Run `vercel env pull .env.local` or copy the connection string from the Neon dashboard.\n",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
