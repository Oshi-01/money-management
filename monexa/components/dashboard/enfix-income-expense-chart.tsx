"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

interface EnfixIncomeExpenseChartProps {
  data: {
    date: string;
    income: number;
    expense: number;
  }[];
  currency: string;
}

export function EnfixIncomeExpenseChart({ data, currency }: EnfixIncomeExpenseChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[250px]" />;

  const isDataEmpty = data.length === 0;

  let chartData: any[] = data;
  if (!isDataEmpty) {
    chartData = data.map((item) => {
      const d = new Date(item.date);
      return {
        ...item,
        displayDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
    });
  }

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-3xl p-6 shadow-sm border-none">
      <h2 className="text-[#1e293b] font-bold text-lg mb-6">Monthly Income vs Expenses</h2>
      
      <div className="flex-1 w-full relative min-h-[200px]">
        {isDataEmpty && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <p className="text-sm text-gray-400 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              No data available.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={-15}>
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
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
                return isDataEmpty ? val.toFixed(0) : (val / 1000).toFixed(0) + "k";
              }}
            />
            {!isDataEmpty && (
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                itemStyle={{ fontSize: "13px", fontWeight: 500 }}
                labelStyle={{ color: "#888888", marginBottom: "4px" }}
                formatter={(value: any) => [formatCurrency(Number(value || 0), currency)]}
              />
            )}
            {/* The overlapping bars from Enfix design */}
            <Bar dataKey="expense" name="Expense" fill="#d1fae5" radius={[0, 0, 0, 0]} barSize={24} />
            <Bar dataKey="income" name="Income" fill="#16a34a" radius={[0, 0, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
