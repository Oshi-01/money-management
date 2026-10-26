import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface EnfixStatCardsProps {
  balance: number;
  currency: string;
  trends: {
    incomeChange: number; expenseChange: number; balanceChange: number;
    thisMonthIncome: number; thisMonthExpense: number; thisMonthBalance: number;
  };
}

export function EnfixStatCards({ balance, currency, trends }: EnfixStatCardsProps) {
  const metrics = [
    { label: "Income", value: trends.thisMonthIncome, change: trends.incomeChange, favorable: trends.incomeChange >= 0, icon: ArrowDownLeft, tone: "text-income", surface: "bg-income-soft" },
    { label: "Spending", value: trends.thisMonthExpense, change: trends.expenseChange, favorable: trends.expenseChange <= 0, icon: ArrowUpRight, tone: "text-expense", surface: "bg-expense-soft" },
  ];
  return (
    <section aria-label="Financial overview" className="app-panel h-full overflow-hidden">
      <div className="bg-primary p-6 text-primary-foreground sm:p-7">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Cash flow balance</p><Wallet aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} /></div>
        <p className="mt-5 break-words text-[clamp(1.8rem,3vw,2.5rem)] font-semibold leading-tight tracking-tight tabular-nums">{formatCurrency(balance, currency)}</p>
        <p className="mt-4 max-w-64 text-xs leading-relaxed text-primary-foreground/80">Recorded income minus spending, including loans marked for totals.</p>
      </div>
      <div className="p-5 sm:p-6">
        <p className="mb-4 text-xs font-medium text-muted-foreground">This month</p>
        <dl className="grid grid-cols-2 gap-4">
          {metrics.map(({ label, value, change, favorable, icon: Icon, tone, surface }) => (
            <div key={label}>
              <dt className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone} ${surface}`}><Icon aria-hidden="true" className="h-3.5 w-3.5" /></span>{label}</dt>
              <dd className="mt-3 break-words text-lg font-semibold tracking-tight text-foreground tabular-nums">{formatCurrency(value, currency)}</dd>
              <dd className={`mt-1 text-xs tabular-nums ${favorable ? "text-income" : "text-expense"}`}>{change >= 0 ? "+" : "−"}{Math.abs(change).toFixed(1)}% <span className="text-muted-foreground">vs last month</span></dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs"><span className="text-muted-foreground">Net change this month</span><span className="font-semibold text-foreground tabular-nums">{formatCurrency(trends.thisMonthBalance, currency)}</span></div>
      </div>
    </section>
  );
}
