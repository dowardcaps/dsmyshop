# Database setup (Prisma 7 + Neon PostgreSQL)

## 1. Create the Neon database
1. Create a project at https://neon.tech.
2. In **Connect**, copy two connection strings:
   - **Pooled** (host contains `-pooler`) -> `DATABASE_URL` (used by the app at runtime)
   - **Direct** (no `-pooler`) -> `DIRECT_URL` (used by migrations)

## 2. Configure environment
```bash
cp .env.example .env.local
# fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, SEED_OWNER_EMAIL, SEED_OWNER_NAME, SEED_OWNER_PASSWORD
```

## 3. Create tables and seed
```bash
npm install                      # also runs `prisma generate`
npm run db:migrate -- --name init   # creates prisma/migrations/*_init and applies it
npm run db:seed                  # owner login + default sale/expense categories
npm run db:check                 # prints server time + row counts
```
Commit the generated `prisma/migrations` folder.

## 4. Verify in the app
`npm run dev`, then open http://localhost:3000/api/health -> `{"status":"ok","database":"connected"}`.

## Production (Vercel)
- Set `DATABASE_URL` (pooled) in Vercel project settings.
- Apply migrations from your machine with `DIRECT_URL` set: `npm run db:deploy`.

## Design notes
- Money: `NUMERIC(12,2)`. Dates: `DATE` (no timezone drift; business timezone is Asia/Manila).
- Every top-level record has a `userId`, so multi-user support can be added later.
- Sale categories are a table (not an enum) so custom categories can be added.
- Expense and sale categories use `onDelete: Restrict`; categories in use cannot be deleted.
- `importKey` columns (unique per user) are reserved for duplicate detection in the Excel import (Stage 10).
- `MonthlyAdjustment.amount` is signed: positive adds to net income, negative subtracts.

See `docs/VERCEL.md` for the full Vercel + Neon walkthrough.
