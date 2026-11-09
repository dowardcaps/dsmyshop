import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, todayInManila } from "@/lib/dates";
import { decimalToCents } from "@/lib/money";
import {
  breakEven,
  dailyFixedCents,
  monthlyTargetProgress,
  percentChange,
  profitOf,
  targetStatus,
  variableCostPctOf,
  type BreakEvenResult,
  type MonthlyTargetProgress,
  type ProfitResult,
  type TargetStatus,
} from "@/lib/performance/calc";
import {
  addMonths,
  daysInMonth,
  monthBounds,
  monthsEndingAt,
} from "@/lib/performance/months";
import {
  getSettings,
  type PerformanceSettings,
} from "@/lib/performance/service";

export interface FixedLine {
  id: string | null;
  name: string;
  cents: number;
  /** "salary" lines come from the Salary tab and are edited there. */
  source: "fixed" | "salary";
}

export interface DayRow {
  date: string;
  salesCents: number;
  materialCents: number;
  otherCents: number;
  /** A day with at least one sale. Only operating days carry a fixed-cost allocation. */
  operating: boolean;
  profit: ProfitResult;
}

export interface MonthSummary {
  month: string;
  profit: ProfitResult;
  salesCents: number;
  materialCents: number;
  otherCents: number;
  fixedCents: number;
}

type KindRow = { d: string; k: string; total: Prisma.Decimal | null };

/** Per-day sales (paid sales + GCash charges + excess money: the same "earned" as the Calendar and the Dashboard's Money in) and expenses split by cost type. */
async function dailyTotals(
  userId: string,
  from: string,
  to: string,
): Promise<KindRow[]> {
  return db.$queryRaw<KindRow[]>`
    SELECT to_char(t.d, 'YYYY-MM-DD') AS d, t.k, SUM(t.a) AS total
    FROM (
      SELECT "transactionDate" AS d, 'sales' AS k, "totalAmount" AS a FROM "Sale" WHERE "userId" = ${userId} AND "isPaid" = true
      UNION ALL SELECT "transactionDate", 'sales', "charge" FROM "GcashTransaction" WHERE "userId" = ${userId}
      UNION ALL SELECT "excessDate", 'sales', "amount" FROM "ExcessMoney" WHERE "userId" = ${userId}
      UNION ALL SELECT e."expenseDate", lower(c."kind"::text), e."amount"
        FROM "Expense" e JOIN "ExpenseCategory" c ON c."id" = e."categoryId" WHERE e."userId" = ${userId}
    ) t
    WHERE t.d BETWEEN ${parseDateInput(from)} AND ${parseDateInput(to)}
    GROUP BY 1, 2`;
}

/** Fixed lines for one month: the fixed costs that apply then, plus salaries (real pay dates, else current salaries). */
async function fixedLinesByMonth(
  userId: string,
  months: string[],
): Promise<Map<string, FixedLine[]>> {
  const first = months[0];
  const last = months[months.length - 1];
  const nowMonth = todayInManila().slice(0, 7);
  const [fixed, periods, employees] = await Promise.all([
    db.fixedExpense.findMany({
      where: { userId },
      orderBy: [{ name: "asc" }, { startMonth: "asc" }],
    }),
    db.salaryPeriod.findMany({
      where: {
        userId,
        payDate: {
          gte: parseDateInput(`${first}-01`),
          lte: parseDateInput(monthBounds(last).to),
        },
      },
      select: { payDate: true, grossAmount: true },
    }),
    db.employee.findMany({
      where: { userId },
      select: { monthlySalary: true },
    }),
  ]);
  const salaryByMonth = new Map<string, number>();
  for (const p of periods) {
    const ym = p.payDate.toISOString().slice(0, 7);
    salaryByMonth.set(
      ym,
      (salaryByMonth.get(ym) ?? 0) + decimalToCents(p.grossAmount),
    );
  }
  const currentSalaries = employees.reduce(
    (sum, e) => sum + decimalToCents(e.monthlySalary),
    0,
  );

  const result = new Map<string, FixedLine[]>();
  for (const ym of months) {
    const at = parseDateInput(`${ym}-01`);
    const lines: FixedLine[] = fixed
      .filter((f) => f.startMonth <= at && (!f.endMonth || f.endMonth >= at))
      .map((f) => ({
        id: f.id,
        name: f.name,
        cents: decimalToCents(f.amount),
        source: "fixed" as const,
      }));
    // Past months use the real pay dates; this and later months use current salaries when no pay dates exist yet.
    const salary =
      salaryByMonth.get(ym) ?? (ym >= nowMonth ? currentSalaries : 0);
    if (salary > 0)
      lines.push({
        id: null,
        name: "Employee salaries",
        cents: salary,
        source: "salary",
      });
    result.set(ym, lines);
  }
  return result;
}

const sumLines = (lines: FixedLine[]) =>
  lines.reduce((sum, l) => sum + l.cents, 0);

export interface PerformanceData {
  month: string;
  isCurrentMonth: boolean;
  settings: PerformanceSettings;
  fixedLines: FixedLine[];
  monthlyFixedCents: number;
  dailyFixedCents: number;
  days: DayRow[];
  /** The day shown in the "Today" cards: today for the current month, otherwise the last day with sales. */
  focus: { date: string; isToday: boolean; row: DayRow } | null;
  monthTotals: MonthSummary;
  previous: MonthSummary;
  /** Percent changes against the previous month (null when there is nothing to compare with). */
  changes: {
    sales: number | null;
    expenses: number | null;
    net: number | null;
  };
  trend: MonthSummary[];
  breakEven: BreakEvenResult;
  /** The variable cost % behind `breakEven`: the saved assumption or the real share this month. */
  variableCostPct: number;
  variableCostPctSource: "setting" | "actual" | "none";
  focusStatus: TargetStatus | null;
  monthlyTarget: MonthlyTargetProgress;
  operatingDaysDone: number;
  /** Where the money went this month: costs by name. */
  expenseBreakdown: { name: string; cents: number }[];
  categorySales: { name: string; cents: number }[];
  paymentMethods: { method: string; cents: number }[];
}

function summarize(
  month: string,
  rows: KindRow[],
  fixedCents: number,
): MonthSummary {
  const sum = (kind: string) =>
    rows
      .filter((r) => r.k === kind && r.d.startsWith(month))
      .reduce((t, r) => t + (r.total ? decimalToCents(r.total) : 0), 0);
  const salesCents = sum("sales");
  const materialCents = sum("material");
  const otherCents = sum("variable");
  return {
    month,
    salesCents,
    materialCents,
    otherCents,
    fixedCents,
    profit: profitOf({
      grossSalesCents: salesCents,
      materialCents,
      otherExpensesCents: otherCents,
      fixedCostCents: fixedCents,
    }),
  };
}

export async function getPerformance(
  userId: string,
  month: string,
): Promise<PerformanceData> {
  const settings = await getSettings(userId);
  const today = todayInManila();
  const nowMonth = today.slice(0, 7);
  const trendMonths = monthsEndingAt(month, 6);
  const prev = addMonths(month, -1);
  const allMonths = [...new Set([...trendMonths, prev])].sort();
  const bounds = { from: `${allMonths[0]}-01`, to: monthBounds(month).to };

  const [rows, fixedByMonth] = await Promise.all([
    dailyTotals(userId, bounds.from, bounds.to),
    fixedLinesByMonth(userId, allMonths),
  ]);
  const fixedLines = fixedByMonth.get(month) ?? [];
  const monthlyFixedCents = sumLines(fixedLines);
  const fixedPerDay = dailyFixedCents(
    monthlyFixedCents,
    settings.operatingDays,
  );

  const monthTotals = summarize(month, rows, monthlyFixedCents);
  const previous = summarize(
    prev,
    rows,
    sumLines(fixedByMonth.get(prev) ?? []),
  );
  const trend = trendMonths.map((m) =>
    summarize(m, rows, sumLines(fixedByMonth.get(m) ?? [])),
  );

  // Daily rows for the chosen month (every calendar day up to today for the current month).
  const lastDay =
    month === nowMonth ? Number(today.slice(8)) : daysInMonth(month);
  const days: DayRow[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const get = (kind: string) =>
      rows
        .filter((r) => r.d === date && r.k === kind)
        .reduce((t, r) => t + (r.total ? decimalToCents(r.total) : 0), 0);
    const salesCents = get("sales");
    const operating = salesCents > 0;
    const materialCents = get("material");
    const otherCents = get("variable");
    days.push({
      date,
      salesCents,
      materialCents,
      otherCents,
      operating,
      profit: profitOf({
        grossSalesCents: salesCents,
        materialCents,
        otherExpensesCents: otherCents,
        fixedCostCents: operating ? fixedPerDay : 0,
      }),
    });
  }

  const focusRow =
    month === nowMonth
      ? days[days.length - 1]
      : [...days].reverse().find((d) => d.operating);
  const focus = focusRow
    ? { date: focusRow.date, isToday: focusRow.date === today, row: focusRow }
    : null;

  // Break-even uses the saved variable-cost % if there is one, otherwise the real share of this month's sales.
  const actualPct = variableCostPctOf(
    monthTotals.salesCents,
    monthTotals.materialCents,
    monthTotals.otherCents,
  );
  const variableCostPct = settings.variableCostPct ?? actualPct ?? 0;
  const variableCostPctSource =
    settings.variableCostPct !== null
      ? "setting"
      : actualPct !== null
        ? "actual"
        : "none";
  const be = breakEven({
    monthlyFixedCents,
    operatingDays: settings.operatingDays,
    variableCostPct,
    dailyTargetCents: settings.dailyTargetCents,
  });

  const operatingDaysDone = days.filter((d) => d.operating).length;
  const monthlyTarget = monthlyTargetProgress({
    salesToDateCents: monthTotals.salesCents,
    dailyTargetCents: settings.dailyTargetCents,
    operatingDays: settings.operatingDays,
    operatingDaysLeft:
      month === nowMonth
        ? Math.max(0, settings.operatingDays - operatingDaysDone)
        : 0,
  });

  const { from, to } = monthBounds(month);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  const [expenseRows, categoryRows, methodRows, gcash] = await Promise.all([
    db.expense.groupBy({
      by: ["categoryId"],
      where: { userId, expenseDate: { gte: fromDate, lte: toDate } },
      _sum: { amount: true },
    }),
    db.saleItem.groupBy({
      by: ["categoryId"],
      where: {
        sale: {
          userId,
          isPaid: true,
          transactionDate: { gte: fromDate, lte: toDate },
        },
      },
      _sum: { subtotal: true },
    }),
    db.sale.groupBy({
      by: ["paymentMethod"],
      where: {
        userId,
        isPaid: true,
        transactionDate: { gte: fromDate, lte: toDate },
      },
      _sum: { totalAmount: true },
    }),
    db.gcashTransaction.aggregate({
      where: { userId, transactionDate: { gte: fromDate, lte: toDate } },
      _sum: { charge: true },
    }),
  ]);
  const [expenseCats, saleCats] = await Promise.all([
    db.expenseCategory.findMany({
      where: { userId },
      select: { id: true, name: true, kind: true },
    }),
    db.saleCategory.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
  ]);
  const expenseName = new Map(expenseCats.map((c) => [c.id, c]));
  const saleName = new Map(saleCats.map((c) => [c.id, c.name]));

  // Costs by name: the fixed lines plus every non-fixed expense category (fixed-type categories are already inside the fixed lines).
  const expenseBreakdown = [
    ...fixedLines.map((l) => ({ name: l.name, cents: l.cents })),
    ...expenseRows
      .filter((r) => expenseName.get(r.categoryId)?.kind !== "FIXED")
      .map((r) => ({
        name: expenseName.get(r.categoryId)?.name ?? "Other",
        cents: r._sum.amount ? decimalToCents(r._sum.amount) : 0,
      })),
  ]
    .filter((e) => e.cents > 0)
    .sort((a, b) => b.cents - a.cents);

  const categorySales = categoryRows
    .map((r) => ({
      name: saleName.get(r.categoryId) ?? "Other",
      cents: r._sum.subtotal ? decimalToCents(r._sum.subtotal) : 0,
    }))
    .sort((a, b) => b.cents - a.cents);
  const gcashCharges = gcash._sum.charge
    ? decimalToCents(gcash._sum.charge)
    : 0;
  if (gcashCharges > 0)
    categorySales.push({ name: "GCash charges", cents: gcashCharges });

  return {
    month,
    isCurrentMonth: month === nowMonth,
    settings,
    fixedLines,
    monthlyFixedCents,
    dailyFixedCents: fixedPerDay,
    days,
    focus,
    monthTotals,
    previous,
    changes: {
      sales: percentChange(monthTotals.salesCents, previous.salesCents),
      expenses: percentChange(
        monthTotals.materialCents +
          monthTotals.otherCents +
          monthTotals.fixedCents,
        previous.materialCents + previous.otherCents + previous.fixedCents,
      ),
      net: percentChange(
        monthTotals.profit.netProfitCents,
        previous.profit.netProfitCents,
      ),
    },
    trend,
    breakEven: be,
    variableCostPct,
    variableCostPctSource,
    focusStatus: focus
      ? targetStatus({
          salesCents: focus.row.salesCents,
          breakEvenCents: be.dailyBreakEvenCents ?? Number.MAX_SAFE_INTEGER,
          minTargetCents: settings.minDailyTargetCents,
          dailyTargetCents: settings.dailyTargetCents,
          growthTargetCents: settings.growthTargetCents,
        })
      : null,
    monthlyTarget,
    operatingDaysDone,
    expenseBreakdown,
    categorySales,
    paymentMethods: methodRows.map((r) => ({
      method: r.paymentMethod,
      cents: r._sum.totalAmount ? decimalToCents(r._sum.totalAmount) : 0,
    })),
  };
}

export interface CategoryKindRow {
  id: string;
  name: string;
  kind: "VARIABLE" | "MATERIAL" | "FIXED";
}

export async function listCategoryKinds(
  userId: string,
): Promise<CategoryKindRow[]> {
  return db.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });
}

/** Earliest month that has any record, so the month picker has a sensible start. */
export async function getEarliestMonth(userId: string): Promise<string> {
  const [sale, expense] = await Promise.all([
    db.sale.findFirst({
      where: { userId },
      orderBy: { transactionDate: "asc" },
      select: { transactionDate: true },
    }),
    db.expense.findFirst({
      where: { userId },
      orderBy: { expenseDate: "asc" },
      select: { expenseDate: true },
    }),
  ]);
  const dates = [sale?.transactionDate, expense?.expenseDate]
    .filter((d): d is Date => !!d)
    .map((d) => d.toISOString().slice(0, 7));
  return dates.sort()[0] ?? todayInManila().slice(0, 7);
}
