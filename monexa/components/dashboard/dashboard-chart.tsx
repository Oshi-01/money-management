"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DashboardChartProps {
  data: {
    date: string;
    income: number;
    expense: number;
  }[];
  currency: string;
}

export function DashboardChart({ data, currency }: DashboardChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="h-full border border-gray-100 shadow-sm flex flex-col rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-center h-[400px]">Loading...</div>
      </Card>
    );
  }

  // Generate placeholder data if empty
  const isDataEmpty = data.length === 0;
  
  const chartData = data.map((item) => {
    const d = new Date(item.date);
    return {
      ...item,
      displayDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });

  const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);
  const avgExpense = data.length > 0 ? totalExpense / data.length : 0;

  return (
    <Card className="h-full border border-gray-100 shadow-sm flex flex-col rounded-xl overflow-hidden bg-white relative">
      <CardHeader className="flex flex-row items-start justify-between pb-6">
        <div>
          <CardTitle className="text-xl font-mono font-medium text-gray-900 flex items-center gap-2">
            {formatCurrency(totalExpense, currency)} <span className="text-sm font-sans text-gray-500 font-normal">Spent</span>
          </CardTitle>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-gray-400">
          <span className="hover:text-teal-600 cursor-pointer transition-colors">Day</span>
          <span className="hover:text-teal-600 cursor-pointer transition-colors">Week</span>
          <span className="text-teal-600 border-b border-teal-600 pb-1 cursor-pointer">Month</span>
          <span className="hover:text-teal-600 cursor-pointer transition-colors">Year</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-6 pl-0 sm:pl-6 pt-2 relative">
        {isDataEmpty && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <p className="text-sm text-gray-400 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              No data available for the last 30 days.
            </p>
          </div>
        )}
        
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={16}>
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }} 
                dy={10} 
                minTickGap={30}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }}
                tickFormatter={(val) => {
                  if (val === 0) return "0";
                  return `$${(val / 1000).toFixed(1)}k`;
                }}
                dx={-10}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f3f4f6" />
              {!isDataEmpty && (
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderRadius: "6px", 
                    border: "none", 
                    color: '#fff',
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" 
                  }}
                  itemStyle={{ fontSize: "13px", fontFamily: "monospace" }}
                  labelStyle={{ color: "#9ca3af", marginBottom: "4px", fontSize: "11px", fontWeight: "bold" }}
                  formatter={(value: any) => [formatCurrency(Number(value || 0), currency)]}
                />
              )}
              {avgExpense > 0 && (
                <ReferenceLine y={avgExpense} stroke="#d1d5db" strokeDasharray="3 3" />
              )}
              {isDataEmpty && (
                <ReferenceLine y={100} stroke="#f3f4f6" strokeDasharray="3 3" />
              )}
              <Bar dataKey="income" name="Income" fill="#14b8a6" radius={[2, 2, 0, 0]} stackId="a" />
              <Bar dataKey="expense" name="Expense" fill="#8b5cf6" radius={[2, 2, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
