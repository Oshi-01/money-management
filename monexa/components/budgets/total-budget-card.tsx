import { CalendarClock, CircleDollarSign, PiggyBank, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface TotalBudgetCardProps {
  /** Sum of every category budget for the month. */
  totalBudget: number;
  /** Spent so far in the categories that have a budget. */
  totalSpent: number;
  /** How many category budgets make up the total. */
  count: number;
  currency: string;
  /** e.g. "October 2026" */
  monthLabel: string;
  /** Show the per-day allowance only while the month is still running. */
  isCurrentMonth: boolean;
}

export function TotalBudgetCard({
  totalBudget,
  totalSpent,
  count,
  currency,
  monthLabel,
  isCurrentMonth,
}: TotalBudgetCardProps) {
  const remaining = totalBudget - totalSpent;
  const isOver = remaining < 0;
  const percent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const isNearLimit = !isOver && percent >= 80;

  const status = isOver
    ? { label: "Over budget", pill: "bg-warning-soft text-warning", bar: "bg-warning" }
    : isNearLimit
      ? { label: "Nearing limit", pill: "bg-warning-soft text-warning", bar: "bg-warning" }
      : { label: "On track", pill: "bg-muted text-secondary-foreground", bar: "bg-progress" };

  // What can still be spent per day for the rest of this month (today included).
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const showDaily = isCurrentMonth && !isOver && remaining > 0;

  const stats = [
    {
      label: "Spent",
      value: formatCurrency(totalSpent, currency),
      icon: CircleDollarSign,
      tone: "bg-expense-soft text-expense",
    },
    {
      label: isOver ? "Over by" : "Remaining",
      value: formatCurrency(Math.abs(remaining), currency),
      icon: PiggyBank,
      tone: isOver ? "bg-warning-soft text-warning" : "bg-muted text-secondary-foreground",
      valueClass: isOver ? "text-warning" : undefined,
    },
    ...(showDaily
      ? [
          {
            label: `Per day · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`,
            value: formatCurrency(remaining / daysLeft, currency),
            icon: CalendarClock,
            tone: "bg-muted text-secondary-foreground",
          },
        ]
      : []),
  ];

  return (
    <section
      aria-label="Total monthly budget"
      className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Total */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-secondary-foreground">
            <Wallet className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Total monthly budget · {monthLabel}</p>
            <p className="break-words text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(totalBudget, currency)}</p>
            <p className="text-xs text-muted-foreground">
              Across {count} {count === 1 ? "category" : "categories"}
            </p>
          </div>
        </div>

        {/* Spent / remaining / per day */}
        <div className={cn("grid gap-3", stats.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
          {stats.map(({ label, value, icon: Icon, tone, valueClass }) => (
            <div key={label} className="flex min-w-40 items-center gap-3 rounded-2xl bg-muted p-3.5">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
                <p className={cn("truncate text-base font-bold tabular-nums text-foreground", valueClass)}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall progress */}
      <div className="mt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-bold text-secondary-foreground">{percent}% of your budget used</span>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status.pill)}>{status.label}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.min(percent, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of the total monthly budget spent"
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-all", status.bar)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Counts spending in categories that have a budget.</p>
      </div>
    </section>
  );
}
