import { redirect } from "next/navigation";

import { createRecordHrefs } from "@/lib/records/href";
import type { RecordTab } from "@/lib/records/tabs";

/** Old list URLs (/sales, /gcash...) now live on the Records page; old bookmarks keep working. */
export function redirectToRecords(tab: RecordTab, params: Record<string, string | string[] | undefined>): never {
  redirect(createRecordHrefs(tab, params).closeHref);
}
