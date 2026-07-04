import {
  Gauge,
  Wallet,
  CircleDollarSign,
  Target,
  Landmark,
  BarChart3,
  ArrowLeftRight,
  Settings,
  User,
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Gauge },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { name: "Categories", href: "/dashboard/categories", icon: CircleDollarSign },
  { name: "Loans", href: "/dashboard/loans", icon: Landmark },
  { name: "Budgets", href: "/dashboard/budgets", icon: Wallet },
  { name: "Savings Goals", href: "/dashboard/savings", icon: Target },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
