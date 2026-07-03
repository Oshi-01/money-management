import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  FileText,
  Settings,
  Landmark,
  CreditCard,
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { name: "Categories", href: "/dashboard/categories", icon: PieChart },
  { name: "Loans", href: "/dashboard/loans", icon: Landmark },
  { name: "Budgets", href: "/dashboard/budgets", icon: CreditCard },
  { name: "Savings Goals", href: "/dashboard/savings", icon: Target },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
