# Deploy to Vercel with a Neon database

## 1. Push the project to GitHub
```bash
git init && git add . && git commit -m "DS Finance"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/<you>/ds-finance.git
git push -u origin main
```
`.env.local` is git-ignored, so no secrets are committed.

## 2. Import into Vercel
Vercel dashboard -> **Add New... -> Project** -> pick the repo -> keep the Next.js defaults.
Do not click Deploy yet if you want the database ready first (the first deploy will fail health checks without it, which is harmless).

## 3. Add the Neon database (from Vercel)
1. Open the project -> **Storage** tab -> **Create Database** -> choose **Neon** (Postgres) -> Continue.
2. Pick a region close to your users (Singapore is closest to the Philippines) and the free plan, name it, Create.
3. When asked which environments to connect, tick **Production, Preview and Development**.
4. Vercel adds these variables to the project automatically:
   - `DATABASE_URL` - pooled connection (the app uses this)
   - `DATABASE_URL_UNPOOLED` - direct connection (migrations use this)

## 4. Add the remaining environment variables
Project -> **Settings -> Environment Variables**:
| Name | Value |
|------|-------|
| `AUTH_SECRET` | output of `openssl rand -base64 32` (any 32+ char random string) |

## 5. Create the tables and your login (run on your computer)
```bash
npm i -g vercel          # once
vercel login
vercel link              # choose this project
vercel env pull .env.local   # downloads DATABASE_URL, DATABASE_URL_UNPOOLED
```
Then add these lines to `.env.local`:
```
AUTH_SECRET="same value as on Vercel"
SEED_OWNER_EMAIL="you@example.com"
SEED_OWNER_NAME="Your Name"
SEED_OWNER_PASSWORD="at-least-10-characters"
```
Run:
```bash
npm install
npm run db:migrate -- --name init   # creates prisma/migrations and applies it to Neon
npm run db:seed                     # your owner account + default categories
npm run db:check                    # should print "Connected."
```
Commit and push the new `prisma/migrations` folder. Afterwards delete `SEED_OWNER_PASSWORD` from `.env.local`.

> The migration runs against your real Neon database, so this is the production database.
> If you want a separate dev database, create a Neon branch and point `.env.local` at that.

## 6. Deploy
Push to `main` (or click **Redeploy**). Then open:
- `https://<your-app>.vercel.app/api/health` -> `{"status":"ok","database":"connected"}`
- `https://<your-app>.vercel.app` -> redirects to `/login`; sign in with the seeded email and password.

## Future schema changes
Change `prisma/schema.prisma`, run `npm run db:migrate -- --name what_changed` locally, commit, push, then apply to production with `npm run db:deploy` (uses the unpooled URL).

## Troubleshooting
- **`Invalid environment configuration`** - `AUTH_SECRET` or `DATABASE_URL` missing in that Vercel environment.
- **Login says invalid credentials** - the seed was run without `SEED_OWNER_PASSWORD`; set it and run `npm run db:seed` again.
- **Migration hangs or fails with a pooler error** - make sure the direct URL (`DATABASE_URL_UNPOOLED` or `DIRECT_URL`) is set.
