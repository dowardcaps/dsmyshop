"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { importStationeryAction } from "@/lib/actions/inventory";

/** Adds every Stationery price-list item that has no inventory item yet (stock 0, linked, bond paper skipped). */
export function ImportStationeryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await importStationeryAction();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(result.data.added === 0 ? "All stationery items are already in your inventory." : `Added ${result.data.added} stationery item${result.data.added === 1 ? "" : "s"} with 0 stock.`);
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <ListPlus />} Add stationery from price list
    </Button>
  );
}
