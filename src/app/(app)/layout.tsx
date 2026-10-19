import { cookies } from "next/headers";

import { AppFrame } from "@/components/layout/app-frame";
import { AppHeader } from "@/components/layout/app-header";
import { AppMain } from "@/components/layout/app-main";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-state";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { SIDEBAR_COLLAPSED, SIDEBAR_COOKIE } from "@/lib/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: the proxy already redirects, this enforces it on the server.
  const sessionUser = await requireUser();
  // The session token keeps the name from sign-in; read the current one so renames show immediately.
  const record = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true },
  });
  const user = { ...sessionUser, name: record?.name ?? sessionUser.name };

  const collapsed =
    (await cookies()).get(SIDEBAR_COOKIE)?.value === SIDEBAR_COLLAPSED;

  return (
    <SidebarProvider initialCollapsed={collapsed}>
      <AppFrame>
        <AppSidebar userName={user.name} />
        <AppHeader userName={user.name} />
        <AppMain>{children}</AppMain>
      </AppFrame>
    </SidebarProvider>
  );
}
