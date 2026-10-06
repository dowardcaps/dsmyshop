import { notFound } from "next/navigation";

import { DebtForm } from "@/components/debts/debt-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { debtToFormValues, getDebt } from "@/lib/debts/queries";

export const metadata = { title: "Edit debt | DS Finance" };

export default async function EditDebtPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const debt = await getDebt(user.id, id);
  if (!debt) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${debt.name}`} description="The amount cannot be lower than what has already been paid." />
      <DebtForm defaultValues={debtToFormValues(debt)} debtId={debt.id} cancelHref={`/debts/${debt.id}`} />
    </div>
  );
}
