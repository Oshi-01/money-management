import Link from "next/link";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SavingsGoal { id: string; title: string; targetAmount: number; savedAmount: number }

export function EnfixSavingsGoals({ goals, currency = "USD" }: { goals: SavingsGoal[]; currency?: string }) {
  return (
    <section className="app-panel">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-1"><h2 className="text-lg font-semibold tracking-tight text-foreground">Savings goals</h2><Link href="/dashboard/savings" className="shrink-0 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all</Link></div>
      <div className="divide-y divide-border/70 px-6">
        {goals.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Set a savings goal to track your progress.</p> : goals.slice(0, 4).map(goal => {
          const percent = Math.max(0, Math.min(Math.round(goal.savedAmount / goal.targetAmount * 100) || 0, 100));
          const complete = percent === 100;
          return (
            <div key={goal.id} className="py-5">
              <div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-medium text-foreground">{goal.title}</p><span className={`flex shrink-0 items-center gap-1 text-xs font-medium ${complete ? "text-success" : "text-muted-foreground"}`}>{complete && <Check aria-hidden="true" className="h-3 w-3" />}{complete ? "Complete" : `${percent}%`}</span></div>
              <div role="progressbar" aria-label={goal.title} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${complete ? "bg-success" : "bg-progress"}`} style={{ width: `${percent}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground tabular-nums">{formatCurrency(goal.savedAmount, currency)} <span className="mx-1">of</span> {formatCurrency(goal.targetAmount, currency)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
