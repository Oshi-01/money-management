"use client";

import { useSyncExternalStore } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

const subscribe = () => () => {};
interface EnfixBalanceTrendProps {
  currency: string;
  savingsTrend: { month: string; net: number }[];
  trends: { balanceChange: number };
}

export function EnfixBalanceTrend({ currency, savingsTrend, trends }: EnfixBalanceTrendProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <section className="h-full app-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Money over time</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Monthly net cash flow, including selected loans.</p></div>
        <p className="text-right text-xs text-muted-foreground"><span className={`block text-sm font-semibold tabular-nums ${trends.balanceChange >= 0 ? "text-income" : "text-expense"}`}>{trends.balanceChange >= 0 ? "+" : "−"}{Math.abs(trends.balanceChange).toFixed(1)}%</span>vs last month</p>
      </div>
      <div className="h-64 w-full sm:h-72" role="img" aria-label="Net cash flow for the last six months">
        {!mounted ? null : savingsTrend.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Your monthly cash flow will appear here.</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={savingsTrend} margin={{ top: 12, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={value => Math.abs(value) >= 1000 ? `${value / 1000}k` : String(value)} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Tooltip contentStyle={{ borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} formatter={value => [formatCurrency(Number(value ?? 0), currency), "Net cash flow"]} />
              <Line type="monotone" dataKey="net" name="Net cash flow" stroke="var(--chart-balance)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
