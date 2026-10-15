import { z } from "zod";

import { datesBetween } from "@/lib/calendar/grid";
import { MAX_RANGE_DAYS, SHOP_DAY_STATUSES } from "@/lib/calendar/constants";
import { dateString } from "@/lib/validation/shared";

export const shopDayInputSchema = z
  .object({
    fromDate: dateString,
    toDate: dateString,
    status: z.enum(SHOP_DAY_STATUSES, {
      error: "Pick open, half day or closed",
    }),
    note: z.string().trim().max(120, "Max 120 characters"),
  })
  .refine((v) => v.fromDate <= v.toDate, {
    path: ["fromDate"],
    message: "From must be on or before To",
  })
  .refine(
    (v) =>
      v.fromDate > v.toDate ||
      datesBetween(v.fromDate, v.toDate).length <= MAX_RANGE_DAYS,
    {
      path: ["toDate"],
      message: `Pick at most ${MAX_RANGE_DAYS} days at a time`,
    },
  );

export type ShopDayInput = z.infer<typeof shopDayInputSchema>;

export const clearRangeSchema = z
  .object({ fromDate: dateString, toDate: dateString })
  .refine(
    (v) =>
      v.fromDate <= v.toDate &&
      datesBetween(v.fromDate, v.toDate).length <= MAX_RANGE_DAYS,
    { message: "Invalid range" },
  );
