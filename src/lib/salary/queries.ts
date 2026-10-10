import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { centsToAmount } from "@/lib/cents";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import { decimalToCents } from "@/lib/money";
import { paginate } from "@/lib/pagination";
import { remainingCents } from "@/lib/salary/calc";
import type { AdvanceInput } from "@/lib/validation/salary";
import type { SalaryFilters } from "@/lib/validation/salary-filters";

export interface SalaryPeriodRow {
  id: string;
  employeeId: string;
  employeeName: string;
  payDate: Date;
  grossCents: number;
  advancesCents: number;
  advanceCount: number;
  /** What is still to be paid out (salary minus advances). */
  remainingCents: number;
  paidOn: Date | null;
}

export interface EmployeeSummary {
  employeeId: string;
  name: string;
  /** Still to be paid: remaining balance of the unpaid pay dates. */
  owedCents: number;
  advancesCents: number;
  paidOutCents: number;
}

export interface SalaryPeriodsResult {
  rows: SalaryPeriodRow[];
  total: number;
  page: number;
  pageCount: number;
  employees: EmployeeSummary[];
  totals: { owedCents: number; advancesCents: number; paidOutCents: number };
}

function periodWhere(userId: string, f: SalaryFilters): Prisma.SalaryPeriodWhereInput {
  return {
    userId,
    ...(f.employeeId ? { employeeId: f.employeeId } : {}),
    ...(f.status === "PAID" ? { paidOn: { not: null } } : f.status === "UNPAID" ? { paidOn: null } : {}),
    ...(f.from || f.to ? { payDate: { ...(f.from ? { gte: parseDateInput(f.from) } : {}), ...(f.to ? { lte: parseDateInput(f.to) } : {}) } } : {}),
    ...(f.q ? { OR: [{ employee: { name: { contains: f.q, mode: "insensitive" } } }, { notes: { contains: f.q, mode: "insensitive" } }] } : {}),
  };
}

/** A few rows per employee per month, so the whole filtered set is read and summed in memory. */
export async function listSalaryPeriods(userId: string, filters: SalaryFilters): Promise<SalaryPeriodsResult> {
  const periods = await db.salaryPeriod.findMany({
    where: periodWhere(userId, filters),
    orderBy: [{ payDate: "desc" }, { employee: { name: "asc" } }],
    include: { employee: { select: { name: true } }, advances: { select: { amount: true } } },
  });

  const all: SalaryPeriodRow[] = periods.map((p) => {
    const gross = decimalToCents(p.grossAmount);
    const advances = p.advances.reduce((sum, a) => sum + decimalToCents(a.amount), 0);
    return {
      id: p.id,
      employeeId: p.employeeId,
      employeeName: p.employee.name,
      payDate: p.payDate,
      grossCents: gross,
      advancesCents: advances,
      advanceCount: p.advances.length,
      remainingCents: remainingCents(gross, advances),
      paidOn: p.paidOn,
    };
  });

  const byEmployee = new Map<string, EmployeeSummary>();
  for (const row of all) {
    const entry = byEmployee.get(row.employeeId) ?? { employeeId: row.employeeId, name: row.employeeName, owedCents: 0, advancesCents: 0, paidOutCents: 0 };
    entry.advancesCents += row.advancesCents;
    if (row.paidOn) entry.paidOutCents += row.remainingCents;
    else entry.owedCents += row.remainingCents;
    byEmployee.set(row.employeeId, entry);
  }
  const employees = [...byEmployee.values()].sort((a, b) => a.name.localeCompare(b.name));
  const sum = (pick: (e: EmployeeSummary) => number) => employees.reduce((total, e) => total + pick(e), 0);

  const page = paginate(all, filters.page, filters.pageSize);
  return {
    rows: page.rows,
    total: all.length,
    page: page.page,
    pageCount: page.pageCount,
    employees,
    totals: { owedCents: sum((e) => e.owedCents), advancesCents: sum((e) => e.advancesCents), paidOutCents: sum((e) => e.paidOutCents) },
  };
}

export interface AdvanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  periodId: string;
  /** The pay date the advance is deducted from. */
  payDate: Date;
  periodPaid: boolean;
  advanceDate: Date;
  amountCents: number;
  notes: string | null;
}

export interface AdvancesResult {
  rows: AdvanceRow[];
  total: number;
  totalCents: number;
  page: number;
  pageCount: number;
}

function advanceWhere(userId: string, f: SalaryFilters): Prisma.SalaryAdvanceWhereInput {
  return {
    userId,
    ...(f.employeeId ? { employeeId: f.employeeId } : {}),
    ...(f.status === "PAID" ? { period: { paidOn: { not: null } } } : f.status === "UNPAID" ? { period: { paidOn: null } } : {}),
    ...(f.from || f.to ? { advanceDate: { ...(f.from ? { gte: parseDateInput(f.from) } : {}), ...(f.to ? { lte: parseDateInput(f.to) } : {}) } } : {}),
    ...(f.q ? { OR: [{ employee: { name: { contains: f.q, mode: "insensitive" } } }, { notes: { contains: f.q, mode: "insensitive" } }] } : {}),
  };
}

const toAdvanceRow = (a: Prisma.SalaryAdvanceGetPayload<{ include: { employee: { select: { name: true } }; period: { select: { payDate: true; paidOn: true } } } }>): AdvanceRow => ({
  id: a.id,
  employeeId: a.employeeId,
  employeeName: a.employee.name,
  periodId: a.periodId,
  payDate: a.period.payDate,
  periodPaid: a.period.paidOn !== null,
  advanceDate: a.advanceDate,
  amountCents: decimalToCents(a.amount),
  notes: a.notes,
});

export async function listSalaryAdvances(userId: string, filters: SalaryFilters): Promise<AdvancesResult> {
  const where = advanceWhere(userId, filters);
  const [total, aggregate] = await Promise.all([db.salaryAdvance.count({ where }), db.salaryAdvance.aggregate({ where, _sum: { amount: true } })]);
  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.advancePage, pageCount);

  const rows = await db.salaryAdvance.findMany({
    where,
    orderBy: [{ advanceDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
    include: { employee: { select: { name: true } }, period: { select: { payDate: true, paidOn: true } } },
  });

  return { rows: rows.map(toAdvanceRow), total, totalCents: aggregate._sum.amount ? decimalToCents(aggregate._sum.amount) : 0, page, pageCount };
}

export async function getSalaryAdvance(userId: string, id: string): Promise<AdvanceRow | null> {
  const advance = await db.salaryAdvance.findFirst({
    where: { id, userId },
    include: { employee: { select: { name: true } }, period: { select: { payDate: true, paidOn: true } } },
  });
  return advance ? toAdvanceRow(advance) : null;
}

export function advanceToFormValues(row: AdvanceRow): AdvanceInput {
  return {
    employeeId: row.employeeId,
    periodId: row.periodId,
    advanceDate: toDateInputValue(row.advanceDate),
    amount: centsToAmount(row.amountCents),
    notes: row.notes ?? "",
  };
}

export interface EmployeeOption {
  id: string;
  name: string;
}

export interface PeriodOption {
  id: string;
  employeeId: string;
  payDate: string;
  /** Salary left to advance on this pay date (excluding the advance being edited, if any). */
  roomCents: number;
}

/** Employees, and the unpaid pay dates an advance can be deducted from. */
export async function listAdvanceOptions(userId: string, editingAdvanceId?: string): Promise<{ employees: EmployeeOption[]; periods: PeriodOption[] }> {
  const [employees, periods] = await Promise.all([
    db.employee.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.salaryPeriod.findMany({
      where: { userId, paidOn: null },
      orderBy: { payDate: "asc" },
      include: { advances: { select: { id: true, amount: true } } },
    }),
  ]);
  return {
    employees,
    periods: periods.map((p) => {
      const used = p.advances.filter((a) => a.id !== editingAdvanceId).reduce((sum, a) => sum + decimalToCents(a.amount), 0);
      return { id: p.id, employeeId: p.employeeId, payDate: toDateInputValue(p.payDate), roomCents: Math.max(0, decimalToCents(p.grossAmount) - used) };
    }),
  };
}
