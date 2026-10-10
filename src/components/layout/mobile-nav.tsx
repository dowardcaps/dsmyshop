"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { NavLinks } from "@/components/layout/nav-links";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Main application navigation</SheetDescription>
        <div className="flex h-full flex-col">
          <Brand />
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <SidebarFooter name={userName} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
