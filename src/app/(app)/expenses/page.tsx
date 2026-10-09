import { redirectToRecords } from "@/lib/records/redirect";

/** The list now lives on the Records page. */
export default async function LegacyExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirectToRecords("expenses", await searchParams);
}
