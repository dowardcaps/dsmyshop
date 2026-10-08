"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/transactions/category-badge";
import { ServiceFormDialog } from "@/components/transactions/service-form-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteServiceAction, resetServicesAction } from "@/lib/actions/transactions";
import { formatPeso } from "@/lib/format";

interface ManagedService {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
}

interface ServiceManagerProps {
  services: ManagedService[];
  categories: { id: string; name: string }[];
}

export function ServiceManager({ services, categories }: ServiceManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ManagedService | null>(null);
  const [adding, setAdding] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return services;
    return services.filter((s) => s.name.toLowerCase().includes(needle) || s.categoryName.toLowerCase().includes(needle));
  }, [services, query]);

  async function resetAll() {
    setResetting(true);
    const result = await resetServicesAction();
    setResetting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Service list reset to the defaults.");
    setResetOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            aria-label="Search services"
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
          <RotateCcw /> Reset to defaults
        </Button>
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus /> Add service
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service / item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <CategoryBadge name={service.categoryName} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPeso(service.price)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(service)} aria-label={`Edit ${service.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDeleteButton
                        iconOnly
                        ariaLabel={`Delete ${service.name}`}
                        action={deleteServiceAction.bind(null, service.id)}
                        title="Delete this service?"
                        description={`"${service.name}" will be removed from the calculator. Past sales are not affected.`}
                        successMessage="Service deleted."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">
        {services.length} services. Changes apply to new sales only; sales already saved keep their own prices.
      </p>

      <ServiceFormDialog open={adding} onOpenChange={setAdding} categories={categories} />
      <ServiceFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        categories={categories}
        service={editing ?? undefined}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to the default list?</DialogTitle>
            <DialogDescription>
              Every service, including the ones you added and any price you changed, is replaced by the original list. Past sales are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={resetting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={resetAll} disabled={resetting}>
              {resetting ? <Loader2 className="animate-spin" /> : null}
              Reset list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
