import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { SidebarPanel } from "@/components/layout/sidebar-panel";

export function AppSidebar({ userName }: { userName: string }) {
  return (
    <SidebarPanel>
      <Brand />
      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <NavLinks />
      </div>
      <SidebarFooter name={userName} />
    </SidebarPanel>
  );
}
