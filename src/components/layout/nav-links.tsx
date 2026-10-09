"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ToolsNav } from "@/components/layout/tools-nav";
import { NAV_ITEMS, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  onNavigate?: () => void;
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = [item.href, ...(item.alsoActiveOn ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
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
      {item.title}
    </Link>
  );
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}
      <div role="separator" className="mx-3 my-2 border-t" />
      <ToolsNav onNavigate={onNavigate} />
    </nav>
  );
}
