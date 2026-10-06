import { notFound } from "next/navigation";

import { GcashForm } from "@/components/gcash/gcash-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { gcashToFormValues, getGcashTransaction } from "@/lib/gcash/queries";

export const metadata = { title: "Edit GCash transaction | DS Finance" };

export default async function EditGcashPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const transaction = await getGcashTransaction(user.id, id);
  if (!transaction) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit transaction" description="Amount and charge are stored separately." />
      <GcashForm defaultValues={gcashToFormValues(transaction)} transactionId={transaction.id} />
    </div>
  );
}
