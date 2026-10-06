"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Wrench } from "lucide-react";

import { TOOL_ITEMS } from "@/lib/tools";
import { cn } from "@/lib/utils";

interface ToolsNavProps {
  onNavigate?: () => void;
}

const childClass = (active: boolean) =>
  cn(
    "rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  );

/** Collapsible "Tools" group for the sidebar. Opens by itself while you are on a /tools page. */
export function ToolsNav({ onNavigate }: ToolsNavProps) {
  const pathname = usePathname();
  const onToolsRoute = pathname === "/tools" || pathname.startsWith("/tools/");
  // null = follow the route (open on /tools pages); true/false = the user toggled it by hand.
  const [manualOpen, setManualOpen] = React.useState<boolean | null>(null);
  const open = manualOpen ?? onToolsRoute;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        aria-controls="tools-nav-list"
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          (open || onToolsRoute) && "text-sidebar-foreground",
        )}
      >
        <Wrench className="size-4" />
        <span className="flex-1 text-left">Tools</span>
        <ChevronRight className={cn("size-4 transition-transform duration-200", open && "rotate-90")} />
      </button>

      <div
        id="tools-nav-list"
        className={cn("grid overflow-hidden transition-all duration-300 ease-in-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        inert={!open}
      >
        <div className="min-h-0">
          <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l pl-3">
            <Link href="/tools" onClick={onNavigate} aria-current={pathname === "/tools" ? "page" : undefined} className={childClass(pathname === "/tools")}>
              All tools
            </Link>
            {TOOL_ITEMS.map((tool) => {
              const href = `/tools/${tool.slug}`;
              const active = pathname === href;
              return (
                <Link key={tool.slug} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={childClass(active)}>
                  {tool.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
