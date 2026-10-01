import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <Brand />
      <NavLinks />
    </aside>
  );
}
