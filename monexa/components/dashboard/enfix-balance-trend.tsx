"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

interface EnfixBalanceTrendProps {
  balance: number;
  currency: string;
  savingsTrend: { month: string; net: number }[];
  trends: {
    balanceChange: number;
  };
}

export function EnfixBalanceTrend({ balance, currency, savingsTrend, trends }: EnfixBalanceTrendProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px]" />;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[#1e293b] font-bold text-lg mb-1">Balance Trends</h2>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(balance, currency).replace(/\.00$/, '')}
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-500 font-medium">
          Last Month
          {trends.balanceChange >= 0 ? (
            <ArrowUpRight className="h-4 w-4 ml-1 text-emerald-500" />
          ) : (
            <ArrowUpRight className="h-4 w-4 ml-1 text-rose-500 transform rotate-90" />
          )}
          <span className={`${trends.balanceChange >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold ml-1`}>
            {Math.abs(trends.balanceChange).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[220px]">
        {savingsTrend.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No data available for trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(val) => {
                  if (val === 0) return "0";
                  return (val / 1000).toFixed(0) + "k";
                }}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                itemStyle={{ fontSize: "14px", fontWeight: 500 }}
                labelStyle={{ color: "#888888", marginBottom: "4px" }}
                formatter={(value: any) => [formatCurrency(Number(value || 0), currency)]}
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
