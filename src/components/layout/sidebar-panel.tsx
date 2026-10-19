"use client";

import { PanelLeftClose } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The desktop sidebar box. Slides away when collapsed; the button that hides it sits in its top corner. */
export function SidebarPanel({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      aria-label="Sidebar"
      aria-hidden={collapsed}
      inert={collapsed}
      data-collapsed={collapsed}
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:flex",
        collapsed && "-translate-x-full",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label="Hide menu"
        title="Hide menu"
        data-testid="sidebar-hide"
        className="absolute right-2 top-4 size-8 text-muted-foreground"
      >
        <PanelLeftClose className="size-4" />
      </Button>
      {children}
    </aside>
  );
}
