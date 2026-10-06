import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu name={userName} />
    </header>
  );
}
