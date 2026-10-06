import { DebtForm } from "@/components/debts/debt-form";
import { PageHeader } from "@/components/layout/page-header";
import { todayInManila } from "@/lib/dates";

export const metadata = { title: "Add debt | DS Finance" };

export default function NewDebtPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add debt" description="Record money you owe. Payments are added afterwards." />
      <DebtForm
        cancelHref="/debts"
        defaultValues={{ name: "", description: "", originalAmount: Number.NaN, debtDate: todayInManila() }}
      />
    </div>
  );
}
