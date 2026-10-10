import { AppHeader } from "@/components/layout/app-header";
import { AppMain } from "@/components/layout/app-main";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: the proxy already redirects, this enforces it on the server.
  const user = await requireUser();

  return (
    <div className="flex h-dvh flex-col lg:pl-64">
      <AppSidebar userName={user.name} />
      <AppHeader userName={user.name} />
      <AppMain>{children}</AppMain>
    </div>
  );
}
