import { db } from "@/lib/db";
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
(async () => {
const a = await db.user.findUniqueOrThrow({ where: { email: "owner@test.local" } });
  const b = await db.user.upsert({ where: { email: "b@test.local" }, update: {}, create: { email: "b@test.local", name: "B" } });
  const clean = async (u: string) => {
    await db.saleItem.deleteMany({ where: { sale: { userId: u } } }); await db.sale.deleteMany({ where: { userId: u } });
    await db.gcashTransaction.deleteMany({ where: { userId: u } }); await db.expense.deleteMany({ where: { userId: u } });
    await db.debtPayment.deleteMany({ where: { debt: { userId: u } } }); await db.debt.deleteMany({ where: { userId: u } });
    await db.monthlyAdjustment.deleteMany({ where: { userId: u } });
  };
  if (process.argv[2]==="clean") { await clean(a.id); await clean(b.id); await db.$disconnect(); return; }
  await clean(a.id); await clean(b.id);
  
  

  const cats = await db.saleCategory.findMany({ where: { userId: a.id } });
  const cPrint = cats.find((c) => c.name === "Printing")!, cXerox = cats.find((c) => c.name === "Xerox")!;
  const ecat = await db.expenseCategory.findFirstOrThrow({ where: { userId: a.id } });
  const mkSale = (n: string, date: string, items: [string, number, number][]) => db.sale.create({ data: {
    userId: a.id, transactionNumber: n, transactionDate: d(date), totalAmount: items.reduce((t, i) => t + i[1] * i[2], 0).toFixed(2),
    items: { create: items.map(([cid, q, p]) => ({ categoryId: cid, description: "x", quantity: q, unitPrice: p.toFixed(2), subtotal: (q * p).toFixed(2) })) } } });
  await mkSale("D-1", "2026-09-01", [[cPrint.id, 1, 10], [cXerox.id, 10, 4]]);          // 50.00
  await mkSale("D-2", "2026-09-30", [[cXerox.id, 2, 5.55]]);                              // 11.10  (last day of month)
  await mkSale("D-3", "2026-10-01", [[cPrint.id, 1, 1000]]);                              // next month
  await mkSale("D-4", "2025-12-31", [[cPrint.id, 1, 777]]);                               // previous year
  await db.expense.create({ data: { userId: a.id, categoryId: ecat.id, expenseDate: d("2026-09-15"), description: "Ink", amount: "20.05" } });
  await db.expense.create({ data: { userId: a.id, categoryId: ecat.id, expenseDate: d("2026-10-02"), description: "Rent", amount: "500.00" } });
  const g = (type: "CASH_IN" | "CASH_OUT" | "LOAD", date: string, amount: string, charge: string) =>
    db.gcashTransaction.create({ data: { userId: a.id, transactionDate: d(date), transactionType: type, amount, charge } });
  await g("CASH_IN", "2026-09-05", "5000.00", "50.00"); await g("CASH_OUT", "2026-09-06", "2000.00", "20.50"); await g("LOAD", "2026-09-07", "100.00", "3.00");
  await db.monthlyAdjustment.create({ data: { userId: a.id, adjustmentDate: d("2026-09-10"), adjustmentType: "SALARY", description: "Salary", amount: "9999.00" } });
  const debt = await db.debt.create({ data: { userId: a.id, name: "dash-debt", originalAmount: "1000.00", debtDate: d("2026-01-01"), status: "PARTIALLY_PAID" } });
  await db.debtPayment.create({ data: { debtId: debt.id, paymentDate: d("2026-02-01"), amount: "250.25" } });
  await db.debt.create({ data: { userId: b.id, name: "b-debt", originalAmount: "5000.00", debtDate: d("2026-01-01") } });
  await db.sale.create({ data: { userId: b.id, transactionNumber: "B-1", transactionDate: d("2026-09-02"), totalAmount: "99999.00" } });

  
 await db.$disconnect();
})();
