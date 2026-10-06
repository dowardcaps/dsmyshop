"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExpenseCategoryForm } from "@/hooks/use-expense-category-form";

interface CategoryDialogProps {
  /** Omit to add a new category. */
  category?: { id: string; name: string; description: string | null };
  /** The button that opens the dialog. */
  children: React.ReactNode;
}

export function CategoryDialog({ category, children }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, submit } = useExpenseCategoryForm({ category, onSaved: () => setOpen(false) });
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Discard unsaved edits when the dialog closes.
    if (!next) reset({ name: category?.name ?? "", description: category?.description ?? "" });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {category ? "Renaming updates every expense in this category." : "Group your expenses, e.g. Packaging or Internet."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input id="category-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name ? <p role="alert" className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">Description (optional)</Label>
            <Input id="category-description" autoComplete="off" aria-invalid={!!errors.description} {...register("description")} />
            {errors.description ? <p role="alert" className="text-xs text-destructive">{errors.description.message}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {category ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
