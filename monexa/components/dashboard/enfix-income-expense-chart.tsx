"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

const subscribe = () => () => {};
interface EnfixIncomeExpenseChartProps { data: { date: string; income: number; expense: number }[]; currency: string }

export function EnfixIncomeExpenseChart({ data, currency }: EnfixIncomeExpenseChartProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const chartData = data.map(item => ({ ...item, displayDate: new Date(item.date).toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" }) }));
  return (
    <section className="h-full app-panel p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold tracking-tight text-foreground">Income &amp; spending</h2><div className="flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 rounded-sm bg-income" />Income</span><span className="flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 rounded-sm bg-expense" />Spending</span></div></div>
      <div className="h-56 w-full" role="img" aria-label="Income and spending by transaction date">
        {!mounted ? null : chartData.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Recorded income and expenses will appear here.</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 0, left: -15, bottom: 4 }} barGap={5}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={value => Math.abs(value) >= 1000 ? `${value / 1000}k` : String(value)} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} formatter={value => formatCurrency(Number(value ?? 0), currency)} />
              <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[3, 3, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              <Bar dataKey="expense" name="Spending" fill="var(--chart-expense)" radius={[3, 3, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
