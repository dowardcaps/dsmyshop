"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * The page area under the header.
 * - Normal pages scroll inside it, centered in a max-width column.
 * - /tools/<name> pages are full-bleed so the embedded tool fills the whole area.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = /^\/tools\/[^/]+/.test(pathname);
  const scrollRef = React.useRef<HTMLElement>(null);

  // The page scrolls inside <main>, so go back to the top after navigating.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (fullBleed) {
    return (
      <main ref={scrollRef} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}
