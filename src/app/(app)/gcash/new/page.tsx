import { GcashForm } from "@/components/gcash/gcash-form";
import { PageHeader } from "@/components/layout/page-header";
import { todayInManila } from "@/lib/dates";

export const metadata = { title: "Add GCash transaction | DS Finance" };

export default function NewGcashPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add transaction" description="Amount and charge are stored separately." />
      <GcashForm
        defaultValues={{
          transactionDate: todayInManila(),
          transactionType: "CASH_IN",
          provider: "GCASH",
          amount: Number.NaN,
          charge: Number.NaN,
          notes: "",
        }}
      />
    </div>
  );
}
