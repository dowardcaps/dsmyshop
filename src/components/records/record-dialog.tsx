"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RecordDialogProps {
  title: string;
  description: string;
  /** Where to go when the dialog is dismissed: the same page without ?new / ?edit. */
  closeHref: string;
  size?: "md" | "lg";
  children: React.ReactNode;
}

/**
 * A form in a modal. It is opened by the URL (?new=1 or ?edit=ID), so the browser Back button
 * closes it, a refresh keeps it, and dashboard links can open it directly.
 */
export function RecordDialog({ title, description, closeHref, size = "md", children }: RecordDialogProps) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : router.replace(closeHref, { scroll: false }))}>
      <DialogContent
        className={cn(
          "max-h-[90dvh] overflow-y-auto sm:max-w-xl",
          size === "lg" && "sm:max-w-3xl",
          // The forms are built as cards; inside a modal the card chrome is just noise.
          "[&_[data-slot=card]]:gap-0 [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-header]]:px-0 [&_[data-slot=card-header]]:pb-3",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
