"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useRecordFilters } from "@/hooks/use-record-filters";
import type { RecordTab } from "@/lib/records/tabs";

/** Forgets the remembered filters and reloads the tab unfiltered. */
export function ClearFiltersButton({ tab, variant = "outline", children = "Clear filters" }: { tab: RecordTab; variant?: "outline" | "ghost"; children?: React.ReactNode }) {
  const router = useRouter();
  const { clear } = useRecordFilters();

  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => {
        clear(tab);
        router.push(`/records?tab=${tab}`, { scroll: false });
      }}
    >
      {children}
    </Button>
  );
}
