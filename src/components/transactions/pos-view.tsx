"use client";

import { Search } from "lucide-react";

import { usePos } from "@/components/transactions/pos-context";
import { ServiceTable } from "@/components/transactions/service-table";
import { TransactionTabs } from "@/components/transactions/transaction-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

/** The POS page content: open transactions, search and filters, and the price list. The Summary lives in PosShell. */
export function PosView() {
  const { cart, askReset } = usePos();

  return (
    <div className="space-y-4">
      <TransactionTabs
        tabs={cart.tabs}
        activeId={cart.active.id}
        onSelect={cart.selectTab}
        onAdd={cart.addTab}
        onRemove={cart.removeTab}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={cart.active.searchTerm}
            onChange={(event) => cart.setSearchTerm(event.target.value)}
            placeholder="Search a service or category (e.g. Xerox)…"
            aria-label="Search services"
            className="h-11 pl-10 text-base"
          />
        </div>
        <Select
          value={cart.category}
          onChange={(event) => cart.setCategory(event.target.value)}
          aria-label="Filter by category"
          className="h-11 w-auto min-w-44 text-base sm:w-56"
        >
          <option value="">All categories</option>
          {cart.categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => {
            cart.setSearchTerm("");
            cart.setCategory("");
          }}
          disabled={!cart.active.searchTerm && !cart.category}
        >
          Clear filters
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-11"
          onClick={askReset}
          disabled={cart.summary.items.length === 0}
        >
          Reset order
        </Button>
      </div>

      <ServiceTable
        services={cart.visibleServices}
        quantityOf={cart.quantityOf}
        onChange={cart.changeQuantity}
        onSet={cart.setQuantity}
        page={cart.page}
        pageCount={cart.pageCount}
        total={cart.total}
        onPage={cart.setPage}
      />
    </div>
  );
}
