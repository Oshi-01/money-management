"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CashFlowProps {
  data: {
    month: string;
    income: number;
    expense: number;
  }[];
  currency: string;
  /** e.g. "September 2026" - the last month shown. */
  periodLabel?: string;
}

export function CashFlowChart({ data, currency, periodLabel }: CashFlowProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#1e293b]">Cash Flow</h3>
        <p className="text-sm text-gray-400">
          Income vs Expenses over the 6 months {periodLabel ? `ending ${periodLabel}` : "up to now"}
        </p>
      </div>
      <div className="flex-1 pb-6 pl-0 sm:pl-6 pt-2">
        {data.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p>No transaction history available.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#888888" }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#888888" }}
                  tickFormatter={(val) => {
                    const str = formatCurrency(val, currency);
                    return str.replace(/\.00$/, "");
                  }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  cursor={{ fill: "transparent" }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  verticalAlign="bottom"
                  iconType="circle"
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
