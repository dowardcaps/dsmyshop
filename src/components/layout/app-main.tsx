"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { useSidebar } from "@/components/layout/sidebar-state";
import { cn } from "@/lib/utils";

/**
 * The page area under the header.
 * - Normal pages scroll inside it, centered in a max-width column (full width while the sidebar is hidden).
 * - /tools/<name>, the POS pages (/transactions...) and Records are full-bleed: the page fills the whole area and manages its own scrolling.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const fullBleed =
    /^\/tools\/[^/]+/.test(pathname) ||
    /^\/(transactions|records)(\/|$)/.test(pathname);
  const scrollRef = React.useRef<HTMLElement>(null);

  // The page scrolls inside <main>, so go back to the top after navigating.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (fullBleed) {
    return (
      <main
        ref={scrollRef}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {children}
      </main>
    );
  }

  return (
    <main
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
    >
      {/* With the menu hidden the page uses the whole width. */}
      <div
        className={cn("mx-auto w-full", collapsed ? "max-w-none" : "max-w-6xl")}
      >
        {children}
      </div>
    </main>
  );
}
