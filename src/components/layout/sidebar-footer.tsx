import { LogOut } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

/** Signed-in name, theme switch and sign out. Pinned to the bottom of the sidebar and the mobile menu. */
export function SidebarFooter({ name }: { name: string }) {
  return (
    <div className="mt-auto flex items-center gap-1 border-t px-3 py-3">
      <span className="min-w-0 flex-1 truncate px-2 text-sm font-medium" title={name}>
        {name}
      </span>
      <ThemeToggle />
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Sign out" title="Sign out">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
