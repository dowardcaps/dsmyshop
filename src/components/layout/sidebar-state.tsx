"use client";

import * as React from "react";

import { sidebarCookie } from "@/lib/sidebar";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarState | null>(null);

/** Desktop sidebar open/closed. Starts from the saved cookie, and saves every change. */
export function SidebarProvider({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);

  const toggle = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      document.cookie = sidebarCookie(next);
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ collapsed, toggle }),
    [collapsed, toggle],
  );
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarState {
  const context = React.useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used inside SidebarProvider");
  return context;
}
