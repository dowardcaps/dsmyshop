import { MobileNav } from "@/components/layout/mobile-nav";

export function AppHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:hidden">
      <MobileNav userName={userName} />
    </header>
  );
}
