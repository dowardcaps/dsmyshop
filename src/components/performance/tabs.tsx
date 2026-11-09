import Link from "next/link";

import {
  PERFORMANCE_TABS,
  type PerformanceTab,
} from "@/lib/performance/constants";
import { cn } from "@/lib/utils";

export function PerformanceTabs({
  active,
  month,
}: {
  active: PerformanceTab;
  month: string;
}) {
  return (
    <nav
      aria-label="Performance sections"
      className="flex gap-1 overflow-x-auto border-b print:hidden"
    >
      {PERFORMANCE_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/performance?tab=${tab.id}&month=${month}`}
          aria-current={tab.id === active ? "page" : undefined}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab.id === active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
