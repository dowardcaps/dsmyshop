# GCash balance (Records > GCash tab)

The card at the top of the GCash tab shows the money currently in the GCash wallet, so nobody has to open the GCash app to check.

## How it is calculated
- **Set balance**: the owner types what the GCash app shows right now (a checkpoint, table `GcashBalanceCheck`).
- **Current balance** = latest checkpoint + the effect of every GCash transaction **recorded after it**:
  - **Cash Out: adds** the amount (the customer sends money to the shop's wallet).
  - **Cash In: subtracts** the amount (the shop sends money out of the wallet).
  - **Load: subtracts** the amount.
  - The charge is the shop's cash income and does not change the wallet. It applies to every provider (GCash, Globe, Smart, ...).
- Editing or deleting a transaction recorded after the checkpoint changes the balance accordingly. Transactions recorded before the checkpoint never change it, because the checkpoint already includes them.
- **Update from GCash app** saves a new checkpoint. If the system's number differs from the app, a warning shows by how much, which means a transaction is missing or wrong.
- The table has a "GCash balance" column showing each transaction's effect (green +, red −).

"Recorded after" is by the time the entry was saved, not the transaction date. So if you add yesterday's forgotten transaction today, it still counts (set the checkpoint when the records are up to date).

## Code
- `lib/gcash/balance.ts` (pure rules), `lib/gcash/balance-service.ts` (checkpoint + sum), `lib/actions/gcash-balance.ts`, `lib/validation/gcash-balance.ts`, `hooks/use-gcash-balance-form.ts`
- `components/gcash/gcash-balance-{card,dialog}.tsx`; table column in `gcash-table.tsx`
- Migration: `npm run db:migrate -- --name add_gcash_balance_check`
