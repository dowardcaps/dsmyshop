import { Wallet } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2 px-6 py-5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">DS Finance</p>
        <p className="text-xs text-muted-foreground">Sales &amp; Expenses</p>
      </div>
    </div>
  );
}
