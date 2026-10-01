"use client";

import { usePathname } from "next/navigation";

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = /^\/tools\/[^/]+/.test(pathname);

  if (fullBleed) {
    return (
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}