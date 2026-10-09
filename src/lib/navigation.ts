import {
  Calculator,
  LayoutDashboard,
  TableProperties,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Other route prefixes that belong to this item (it stays highlighted on them). */
  alsoActiveOn?: readonly string[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", href: "/transactions", icon: Calculator },
  { title: "Records", href: "/records", icon: TableProperties, alsoActiveOn: ["/sales", "/gcash", "/expenses", "/debts"] },
  { title: "Reports", href: "/reports", icon: FileBarChart },
  { title: "Settings", href: "/settings", icon: Settings },
];
