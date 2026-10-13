import Link from "next/link";
import { ChevronRight, ListChecks, Tags } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmployeesCard } from "@/components/settings/employees-card";
import { PasswordCard } from "@/components/settings/password-card";
import { PreferencesCard } from "@/components/settings/preferences-card";
import { ProfileCard } from "@/components/settings/profile-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { getAccount, listEmployees } from "@/lib/settings/service";

export const metadata = { title: "Settings | DS Finance" };

const SHORTCUTS = [
  { href: "/expenses/categories", label: "Expense categories", hint: "Add or rename expense groups", icon: Tags },
  { href: "/transactions/services", label: "Price list", hint: "Items, prices and inventory links", icon: ListChecks },
] as const;

export default async function SettingsPage() {
  const user = await requireUser();
  const [account, employees] = await Promise.all([getAccount(user.id), listEmployees(user.id)]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your account, preferences and employees." />
      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileCard name={account.name} email={account.email} />
        <PasswordCard />
        <PreferencesCard />
        <EmployeesCard employees={employees} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SHORTCUTS.map(({ href, label, hint, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="transition-colors group-hover:bg-accent">
              <CardContent className="flex items-center gap-3">
                <Icon className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{hint}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
