"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ icon }: { icon: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      {icon} Print
    </Button>
  );
}
