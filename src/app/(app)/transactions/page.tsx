import Link from "next/link";
import { ListChecks, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PosView } from "@/components/transactions/pos-view";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { ensureServiceCatalog, listServices } from "@/lib/transactions/catalog";

export const metadata = { title: "Transactions | DS Finance" };

export default async function TransactionsPage() {
  const user = await requireUser();
  await ensureServiceCatalog(user.id);
  const services = await listServices(user.id);

  const actions = (
    <>
      <Button asChild variant="outline">
        <Link href="/transactions/services">
          <ListChecks /> Manage services
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/records?tab=sales">
          <ShoppingCart /> View sales
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Add items, then Save to Sales. The summary is written for you and the sale appears on the Sales page."
        actions={actions}
      />
      {services.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Your service list is empty"
          description="Add the services and items you sell, with their prices, to start using the calculator."
          action={
            <Button asChild>
              <Link href="/transactions/services">Manage services</Link>
            </Button>
          }
        />
      ) : (
        <PosView
          services={services.map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            categoryName: service.categoryName,
          }))}
        />
      )}
    </div>
  );
}
