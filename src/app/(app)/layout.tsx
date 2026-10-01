import { AppHeader } from "@/components/layout/app-header";
import { AppMain } from "@/components/layout/app-main";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col lg:pl-64">
      <AppSidebar />
      <AppHeader />
      <AppMain>{children}</AppMain>
    </div>
  );
}