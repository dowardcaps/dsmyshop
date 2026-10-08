import {
  Calculator,
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  Receipt,
  HandCoins,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", href: "/transactions", icon: Calculator },
  { title: "Sales", href: "/sales", icon: ShoppingCart },
  { title: "GCash Transactions", href: "/gcash", icon: Smartphone },
  { title: "Expenses", href: "/expenses", icon: Receipt },
  { title: "Debts", href: "/debts", icon: HandCoins },
  { title: "Reports", href: "/reports", icon: FileBarChart },
  { title: "Settings", href: "/settings", icon: Settings },
];
