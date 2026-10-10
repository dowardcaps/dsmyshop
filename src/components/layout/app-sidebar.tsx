import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import { SidebarFooter } from "@/components/layout/sidebar-footer";

export function AppSidebar({ userName }: { userName: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <Brand />
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <NavLinks />
      </div>
      <SidebarFooter name={userName} />
    </aside>
  );
}
