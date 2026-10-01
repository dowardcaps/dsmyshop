"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import { TOOL_ITEMS } from "@/lib/tools";

interface ToolsNavProps {
  onNavigate?: () => void;
}

export function ToolsNav({ onNavigate }: ToolsNavProps) {
  const pathname = usePathname();
  const onToolsRoute = pathname.startsWith("/tools");
  const [open, setOpen] = React.useState(onToolsRoute);

  React.useEffect(() => {
    if (onToolsRoute) setOpen(true);
  }, [onToolsRoute]);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          (open || onToolsRoute) && "text-sidebar-foreground",
        )}
      >
        <Wrench className="size-4" />
        <span className="flex-1 text-left">Tools</span>
        <ChevronRight
          className={cn("size-4 transition-transform duration-200", open && "rotate-90")}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l pl-3">
            {/* "All tools" link */}
            <Link
              href="/tools"
              onClick={onNavigate}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors",
                pathname === "/tools"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              All tools
            </Link>

            {TOOL_ITEMS.map((tool) => {
              const href = `/tools/${tool.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={tool.slug}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
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