import "server-only";

import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { ShopDayStatusValue } from "@/lib/calendar/constants";
import { monthEnd, monthStart } from "@/lib/calendar/grid";

export interface ShopDayRow {
  date: string;
  status: ShopDayStatusValue;
  note: string | null;
}

/** The days of a month that have a status, keyed by date. */
export async function listShopDays(
  userId: string,
  month: string,
): Promise<Map<string, ShopDayRow>> {
  const rows = await db.shopDay.findMany({
    where: {
      userId,
      dayDate: {
        gte: parseDateInput(monthStart(month)),
        lte: parseDateInput(monthEnd(month)),
      },
    },
    orderBy: { dayDate: "asc" },
  });
  return new Map(
    rows.map((r) => [
      toDateInputValue(r.dayDate),
      { date: toDateInputValue(r.dayDate), status: r.status, note: r.note },
    ]),
  );
}
