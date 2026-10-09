import { redirectToRecords } from "@/lib/records/redirect";

/** The list now lives on the Records page. */
export default async function LegacyDebtsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirectToRecords("debts", await searchParams);
}
