import { PosShell } from "@/components/transactions/pos-shell";
import { requireUser } from "@/lib/auth/require-user";
import { ensureServiceCatalog, listServices } from "@/lib/transactions/catalog";

/** Shared by /transactions (POS) and /transactions/services: one full-screen frame with one Summary. */
export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  await ensureServiceCatalog(user.id);
  const services = await listServices(user.id);

  return (
    <PosShell
      services={services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        categoryName: service.categoryName,
      }))}
    >
      {children}
    </PosShell>
  );
}
