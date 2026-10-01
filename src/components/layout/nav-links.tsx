"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ToolsNav } from "@/components/layout/tools-nav";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {title}
          </Link>
        );
      })}

      {/* Divider + Tools accordion */}
      <div className="my-2 h-px bg-border/60" />
      <ToolsNav onNavigate={onNavigate} />
    </nav>
  );
}