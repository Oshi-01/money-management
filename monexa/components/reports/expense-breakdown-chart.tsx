import { formatCurrency } from "@/lib/utils";

interface ExpenseBreakdownProps {
  data: { name: string; value: number; percent?: number }[];
  currency: string;
  periodLabel?: string;
  title?: string;
}

/** One spending color; category names and values identify each bar. */
export function ExpenseBreakdownChart({ data, currency, periodLabel, title = "Expense Breakdown" }: ExpenseBreakdownProps) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const rows = [...data].sort((a, b) => b.value - a.value);
  return (
    <section className="flex h-full w-full flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{periodLabel ? `Spending in ${periodLabel}` : "Share of recorded expenses"}</p>
      </div>
      {rows.length === 0 ? (
        <div className="flex min-h-48 flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
          No expenses recorded{periodLabel ? ` in ${periodLabel}` : ""}.
        </div>
      ) : (
        <ol className="space-y-5">
          {rows.map((row, index) => {
            // A top-categories summary supplies shares of ALL spending, including
            // categories outside this list. Preserve that denominator.
            const share = row.percent ?? (total > 0 ? (row.value / total) * 100 : 0);
            return (
              <li key={`${row.name}-${index}`} className="space-y-2">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0 break-words font-medium text-foreground">{row.name}</span>
                  <span className="shrink-0 text-right tabular-nums text-secondary-foreground">
                    {formatCurrency(row.value, currency)} <span className="ml-2 text-xs text-muted-foreground">{Math.round(share)}%</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-expense" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
