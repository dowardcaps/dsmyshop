import "server-only";

import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { datesBetween } from "@/lib/calendar/grid";
import type { ShopDayInput } from "@/lib/validation/calendar";

/** Sets the same status (and note) on every day from `fromDate` to `toDate`, replacing what was there. */
export async function setShopDays(
  userId: string,
  input: ShopDayInput,
): Promise<number> {
  const dates = datesBetween(input.fromDate, input.toDate);
  const note = input.note || null;
  await db.$transaction(
    dates.map((date) =>
      db.shopDay.upsert({
        where: { userId_dayDate: { userId, dayDate: parseDateInput(date) } },
        create: {
          userId,
          dayDate: parseDateInput(date),
          status: input.status,
          note,
        },
        update: { status: input.status, note },
      }),
    ),
  );
  return dates.length;
}

/** Removes the status from the days in the range (they go back to "not set"). */
export async function clearShopDays(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<number> {
  const { count } = await db.shopDay.deleteMany({
    where: {
      userId,
      dayDate: { gte: parseDateInput(fromDate), lte: parseDateInput(toDate) },
    },
  });
  return count;
}
