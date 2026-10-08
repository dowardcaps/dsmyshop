import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ServiceManager } from "@/components/transactions/service-manager";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { listSaleCategories } from "@/lib/sales/queries";
import { ensureServiceCatalog, listServices } from "@/lib/transactions/catalog";

export const metadata = { title: "Services | DS Finance" };

export default async function ServicesPage() {
  const user = await requireUser();
  await ensureServiceCatalog(user.id);
  const [services, categories] = await Promise.all([listServices(user.id), listSaleCategories(user.id)]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services & prices"
        description="The price list used by the Transactions calculator."
        actions={
          <Button asChild variant="outline">
            <Link href="/transactions">
              <ArrowLeft /> Back to Transactions
            </Link>
          </Button>
        }
      />
      <ServiceManager services={services} categories={categories} />
    </div>
  );
}
