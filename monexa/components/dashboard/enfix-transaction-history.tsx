import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type RecentTransaction = {
  id: string; description: string; amount: number; type: "INCOME" | "EXPENSE";
  date: Date; category: { name: string } | null;
};

export function EnfixTransactionHistory({ transactions, currency }: { transactions: RecentTransaction[]; currency: string }) {
  return (
    <section className="overflow-hidden app-panel">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent transactions</h2>
        <Link href="/dashboard/transactions" className="shrink-0 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all</Link>
      </div>
      {transactions.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No transactions yet. Add your first transaction to start tracking.</p> : (
        <ul className="divide-y divide-border/70 px-5">
          {transactions.map(transaction => {
            const income = transaction.type === "INCOME";
            const Icon = income ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={transaction.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-1 py-4 sm:grid-cols-[32px_minmax(0,1fr)_90px_auto]">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${income ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}><Icon aria-hidden="true" className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{transaction.description}</p><p className="mt-1 truncate text-xs text-muted-foreground">{transaction.category?.name ?? "Other"} · {income ? "Income" : "Expense"}</p></div>
                <time dateTime={new Date(transaction.date).toISOString().slice(0, 10)} className="hidden text-xs text-muted-foreground sm:block">{new Date(transaction.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</time>
                <p className={`text-right text-sm font-semibold tabular-nums ${income ? "text-income" : "text-expense"}`}>{income ? "+" : "−"}{formatCurrency(transaction.amount, currency)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
