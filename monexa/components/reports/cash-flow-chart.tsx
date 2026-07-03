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
}

export function CashFlowChart({ data, currency }: CashFlowProps) {
  return (
    <Card className="flex flex-col border-none shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Cash Flow</CardTitle>
        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-6 pl-0 sm:pl-6 pt-2">
        {data.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center text-sm text-muted-foreground bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-dashed">
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
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  cursor={{ fill: "transparent" }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  verticalAlign="bottom"
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
