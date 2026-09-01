"use client";

import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useState, useEffect } from "react";

interface EnfixStatCardsProps {
  balance: number;
  currency: string;
  trends: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
    totalBalanceChange: number;
    lastMonthIncome: number;
    lastMonthExpense: number;
    lastMonthBalance: number;
    thisMonthIncome: number;
    thisMonthExpense: number;
    thisMonthBalance: number;
  };
  savingsTrend: { month: string; net: number }[];
  incomeTrend: { month: string; income: number }[];
  expenseTrend: { month: string; expense: number }[];
}

export function EnfixStatCards({
  balance,
  currency,
  trends,
  savingsTrend,
  incomeTrend,
  expenseTrend
}: EnfixStatCardsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cards = [
    {
      // All-time cumulative balance. Its % reflects how much that cumulative
      // total grew this month, relative to what it was before this month.
      title: "Total Balance",
      amount: balance,
      trendText: `Before this month ${formatCurrency(balance - trends.thisMonthBalance, currency).replace(/\.00$/, '')}`,
      trendPercent: `${Math.abs(trends.totalBalanceChange).toFixed(2)}%`,
      isPositive: trends.totalBalanceChange >= 0,
      chartColor: "#10b981", // emerald-500
      data: savingsTrend,
      dataKey: "net"
    },
    {
      // This period's net cash flow (income - expense), compared to last
      // period's net cash flow.
      title: "Total Period Change",
      amount: trends.thisMonthBalance,
      trendText: `Last month ${formatCurrency(trends.lastMonthBalance, currency).replace(/\.00$/, '')}`,
      trendPercent: `${Math.abs(trends.balanceChange).toFixed(2)}%`,
      isPositive: trends.balanceChange >= 0,
      chartColor: "#10b981", // emerald-500
      data: savingsTrend,
      dataKey: "net"
    },
    {
      title: "Total Period Expenses",
      amount: trends.thisMonthExpense,
      trendText: `Last month ${formatCurrency(trends.lastMonthExpense, currency).replace(/\.00$/, '')}`,
      trendPercent: `${Math.abs(trends.expenseChange).toFixed(2)}%`,
      isPositive: trends.expenseChange <= 0,
      chartColor: "#f43f5e", // rose-500
      data: expenseTrend,
      dataKey: "expense"
    },
    {
      title: "Total Period Income",
      amount: trends.thisMonthIncome,
      trendText: `Last month ${formatCurrency(trends.lastMonthIncome, currency).replace(/\.00$/, '')}`,
      trendPercent: `${Math.abs(trends.incomeChange).toFixed(2)}%`,
      isPositive: trends.incomeChange >= 0,
      chartColor: "#10b981", // emerald-500
      data: incomeTrend,
      dataKey: "income"
    }
  ];

  if (!mounted) return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full min-h-[300px]" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      {cards.map((card, idx) => {
        const linearId = `colorStat_${idx}`;
        return (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border-none flex flex-col justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-[#1e293b] mb-2">{card.title}</h3>
              <p className="text-2xl font-bold text-[#1e293b] mb-3">
                {formatCurrency(card.amount, currency).replace(/\.00$/, '')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`flex items-center font-bold ${card.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {card.isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {card.trendPercent}
                </span>
                <span>{card.trendText}</span>
              </div>
            </div>

            {/* The Linear linear Area Chart */}
            <div className="flex-1 mt-6 h-12 relative overflow-hidden -mx-5 -mb-5 rounded-b-2xl">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.data as any[]} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={linearId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={card.chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={card.chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={card.dataKey}
                    stroke={card.chartColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${linearId})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
