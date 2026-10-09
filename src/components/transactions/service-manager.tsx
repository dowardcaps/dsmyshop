"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Loader2, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { BulkActionBar } from "@/components/transactions/bulk-action-bar";
import { BulkEditDialog } from "@/components/transactions/bulk-edit-dialog";
import { ClientPagination } from "@/components/shared/client-pagination";
import { CategoryBadge } from "@/components/transactions/category-badge";
import { ServiceFormDialog } from "@/components/transactions/service-form-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePagination } from "@/hooks/use-pagination";
import { useServiceSelection } from "@/hooks/use-service-selection";
import { bulkDeleteServicesAction, deleteServiceAction, resetServicesAction } from "@/lib/actions/transactions";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return services;
    return services.filter((s) => s.name.toLowerCase().includes(needle) || s.categoryName.toLowerCase().includes(needle));
  }, [services, query]);

  const pager = usePagination(visible, { resetKey: query });
  const matchingIds = useMemo(() => visible.map((service) => service.id), [visible]);
  const pageIds = useMemo(() => pager.rows.map((service) => service.id), [pager.rows]);
  const selection = useServiceSelection(matchingIds, pageIds);
  const selectedServices = useMemo(() => visible.filter((service) => selection.isChecked(service.id)), [visible, selection]);

  async function resetAll() {
    setResetting(true);
    const result = await resetServicesAction();
    setResetting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Service list reset to the defaults.");
    selection.clear();
    setResetOpen(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    const result = await bulkDeleteServicesAction({ ids: selection.selectedIds });
    setBulkDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Deleted ${result.data.count} ${result.data.count === 1 ? "service" : "services"}.`);
    selection.clear();
    setBulkDeleteOpen(false);
    router.refresh();
  }

  const bulk = selection.bulkMode;
  const columns = bulk ? 5 : 4;

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
        <Button type="button" variant={bulk ? "secondary" : "outline"} aria-pressed={bulk} onClick={() => selection.setBulkMode(!bulk)}>
          <ListChecks /> {bulk ? "Done selecting" : "Bulk edit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
          <RotateCcw /> Reset to defaults
        </Button>
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus /> Add service
        </Button>
      </div>

      {bulk && selection.allOnPageSelected && visible.length > pager.rows.length ? (
        <p className="rounded-lg border bg-accent/40 px-3 py-2 text-sm" role="status">
          {selection.allMatchingSelected ? (
            <>
              All {visible.length} matching services are selected.{" "}
              <button type="button" className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline" onClick={selection.clear}>
                Clear selection
              </button>
            </>
          ) : (
            <>
              All {pager.rows.length} services on this page are selected.{" "}
              <button type="button" className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline" onClick={selection.selectAllMatching}>
                Select all {visible.length} matching
              </button>
            </>
          )}
        </p>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              {bulk ? (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all services on this page"
                    checked={selection.allOnPageSelected}
                    indeterminate={selection.pageSelectedCount > 0 && !selection.allOnPageSelected}
                    onChange={selection.togglePage}
                    disabled={pager.rows.length === 0}
                  />
                </TableHead>
              ) : null}
              <TableHead>Service / item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              {bulk ? null : <TableHead className="w-28 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns} className="py-12 text-center text-muted-foreground">
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              pager.rows.map((service) => {
                const checked = selection.isChecked(service.id);
                return (
                  <TableRow key={service.id} className={cn(checked && "bg-accent/50")} data-state={checked ? "selected" : undefined}>
                    {bulk ? (
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${service.name} (${service.categoryName})`}
                          checked={checked}
                          onChange={() => undefined}
                          onClick={(event) => selection.toggle(service.id, event.shiftKey)}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <CategoryBadge name={service.categoryName} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatPeso(service.price)}</TableCell>
                    {bulk ? null : (
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
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ClientPagination page={pager.page} pageCount={pager.pageCount} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.setPage} className="border-t px-4 py-3" />
      </Card>
      <p className="text-xs text-muted-foreground">
        {bulk
          ? "Tick the services to change. Shift-click selects a range on this page. Selections are kept as you change pages."
          : `${services.length} services. Changes apply to new sales only; sales already saved keep their own prices.`}
      </p>

      {bulk && selection.totalChecked > 0 ? (
        <BulkActionBar
          count={selection.selectedIds.length}
          hiddenCount={selection.hiddenCount}
          onEdit={() => setBulkEditOpen(true)}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={selection.clear}
        />
      ) : null}

      <ServiceFormDialog open={adding} onOpenChange={setAdding} categories={categories} />
      <ServiceFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        categories={categories}
        service={editing ?? undefined}
      />

      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        targets={selectedServices.map((s) => ({ id: s.id, name: s.name, price: s.price }))}
        categories={categories}
        onSaved={() => {
          selection.clear();
          router.refresh();
        }}
      />

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selection.selectedIds.length} {selection.selectedIds.length === 1 ? "service" : "services"}?
            </DialogTitle>
            <DialogDescription>They will be removed from the calculator. Past sales are not affected. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={bulkDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={bulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? <Loader2 className="animate-spin" /> : null}
              Delete {selection.selectedIds.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
