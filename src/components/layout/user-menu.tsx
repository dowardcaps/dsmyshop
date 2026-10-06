import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

export function UserMenu({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline">{name}</span>
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Sign out" title="Sign out">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
