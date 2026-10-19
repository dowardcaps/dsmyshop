"use client";

import { PanelLeftOpen } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The page frame. On desktop it leaves room for the sidebar, or none when the sidebar is hidden
 * (then a slim bar with a "Show menu" button sits on top).
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-dvh flex-col transition-[padding] duration-200",
        collapsed ? "lg:pl-0" : "lg:pl-64",
      )}
    >
      {collapsed ? (
        <div
          className="hidden h-12 shrink-0 items-center gap-2 border-b bg-background px-3 lg:flex"
          data-testid="sidebar-collapsed-bar"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Show menu"
            title="Show menu"
            data-testid="sidebar-show"
          >
            <PanelLeftOpen className="size-5" />
          </Button>
          <span className="text-sm font-semibold">DS Finance</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}
