"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

interface ExpenseBreakdownProps {
  data: {
    name: string;
    value: number;
  }[];
  currency: string;
  /** e.g. "September 2026" */
  periodLabel?: string;
}

export function ExpenseBreakdownChart({ data, currency, periodLabel }: ExpenseBreakdownProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#1e293b]">Expense Breakdown</h3>
        <p className="text-sm text-gray-400">Where your money went{periodLabel ? ` in ${periodLabel}` : " this month"}</p>
      </div>
      <div className="flex-1 pb-6">
        {data.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p>No expenses recorded{periodLabel ? ` in ${periodLabel}` : " this month"}.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
