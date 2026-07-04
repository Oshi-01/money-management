"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Carrot, TrendingDown, Target, Wallet, Download, Plus, AlertCircle, ShoppingBag, Car, GraduationCap, DollarSign, Shirt } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Button } from "@/components/ui/button";

interface EnfixBudgetCategoryData {
  id: string;
  categoryId: string;
  amount: number;
  spentAmount: number;
  lastMonthSpent: number;
  isOverBudget: boolean;
  category: {
    id: string;
    name: string;
  };
  history: {
    month: string;
    fullMonth: string;
    spent: number;
    budget: number;
  }[];
}

interface EnfixBudgetsClientProps {
  budgets: EnfixBudgetCategoryData[];
  currency: string;
  currentMonth: string;
  categories: any[];
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('grocer') || lower.includes('food')) return Carrot;
  if (lower.includes('transport') || lower.includes('car')) return Car;
  if (lower.includes('education') || lower.includes('school')) return GraduationCap;
  if (lower.includes('cloth') || lower.includes('apparel')) return Shirt;
  if (lower.includes('shop')) return ShoppingBag;
  return Wallet;
};

export function EnfixBudgetsClient({ budgets, currency, currentMonth, categories }: EnfixBudgetsClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(budgets.length > 0 ? budgets[0].id : null);

  const selectedBudget = budgets.find(b => b.id === selectedId) || budgets[0];

  if (!selectedBudget) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <Target className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Budgets Yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            You haven't set up any budgets for this month. Start by adding a new budget limit for your categories.
          </p>
          <Dialog>
            <DialogTrigger render={
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6">
                <Plus className="mr-2 h-4 w-4" /> Add New Budget
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set Budget Limit</DialogTitle>
              </DialogHeader>
              <BudgetForm categories={categories} currentMonth={currentMonth} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  const Icon = getCategoryIcon(selectedBudget.category.name);
  const percent = Math.min(Math.round((selectedBudget.spentAmount / selectedBudget.amount) * 100) || 0, 100);
  const remaining = Math.max(selectedBudget.amount - selectedBudget.spentAmount, 0);

  // Prepare chart data
  const chartData = selectedBudget.history.map(h => ({
    month: h.month,
    spent: h.spent,
    remaining: Math.max(h.budget - h.spent, 0),
    over: h.spent > h.budget ? h.spent - h.budget : 0
  }));

  // Comparative analysis calculations
  const variance = selectedBudget.spentAmount - selectedBudget.lastMonthSpent;
  const isVariancePositive = variance > 0; // More spent this month than last month

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">

      {/* Left Sidebar: Budget List */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <h2 className="text-[#1e293b] font-bold text-lg px-2">Budgets List</h2>

        <div className="space-y-4">
          {budgets.map(b => {
            const BIcon = getCategoryIcon(b.category.name);
            const isActive = b.id === selectedId;
            const bPercent = Math.min(Math.round((b.spentAmount / b.amount) * 100) || 0, 100);

            return (
              <div
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={`cursor-pointer rounded-2xl p-5 transition-all ${isActive
                    ? 'bg-emerald-600 shadow-md text-white'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-transparent hover:border-emerald-100'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-emerald-100/50 text-emerald-600'}`}>
                      <BIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{b.category.name}</h3>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                        {formatCurrency(b.amount, currency)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    Month
                  </span>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <span className="font-bold text-sm">{formatCurrency(b.spentAmount, currency)}</span>
                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                    {formatCurrency(b.amount, currency)}
                  </span>
                </div>

                <div className={`w-full h-1.5 rounded-full mb-2 ${isActive ? 'bg-white/30' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`}
                    style={{ width: `${bPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-medium">
                  <span>{bPercent}%</span>
                  <span>{b.isOverBudget ? 'Over budget' : 'On track'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <Dialog>
          <DialogTrigger render={
            <div className="cursor-pointer bg-white rounded-2xl p-5 flex items-center justify-between text-gray-700 font-bold hover:bg-emerald-50 transition-colors border border-dashed border-gray-200">
              <span>Add new budget</span>
              <Plus className="w-5 h-5 text-emerald-500" />
            </div>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Budget Limit</DialogTitle>
            </DialogHeader>
            <BudgetForm categories={categories} currentMonth={currentMonth} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Right Content: Budget Details */}
      <div className="flex-1 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">{selectedBudget.category.name}</h1>
            <p className="text-sm text-gray-400">Budget overview and analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
              <button className="px-4 py-1.5 text-sm font-bold text-gray-500 rounded-full hover:bg-gray-50">Weekly</button>
              <button className="px-4 py-1.5 text-sm font-bold text-white bg-emerald-600 rounded-full">Monthly</button>
              <button className="px-4 py-1.5 text-sm font-bold text-gray-500 rounded-full hover:bg-gray-50">Yearly</button>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Total Budget</p>
              <h3 className="text-xl font-bold text-[#1e293b]">{formatCurrency(selectedBudget.amount, currency)}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Spent</p>
              <h3 className="text-xl font-bold text-[#1e293b]">{formatCurrency(selectedBudget.spentAmount, currency)}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Remaining</p>
              <h3 className="text-xl font-bold text-[#1e293b]">{formatCurrency(remaining, currency)}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h3 className="text-lg font-bold text-[#1e293b] mb-6">Budget Utilization</h3>
          <div className="flex justify-between text-sm font-bold text-gray-400 mb-2">
            <span>{formatCurrency(selectedBudget.spentAmount, currency)} spent</span>
            <span>{formatCurrency(selectedBudget.amount, currency)} total</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${selectedBudget.isOverBudget ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold mt-2">
            <span className={selectedBudget.isOverBudget ? 'text-rose-500' : 'text-amber-500'}>
              {percent}% of budget used
            </span>
            <span className="text-gray-400">
              {selectedBudget.isOverBudget ? '0 remaining' : `${formatCurrency(remaining, currency)} remaining`}
            </span>
          </div>
        </div>

        {/* Budget Period Chart & Comparative Analysis Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Budget Period Stacked Bar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex flex-col">
            <h3 className="text-lg font-bold text-[#1e293b] mb-6">Budget Period</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  {/* Spent Layer */}
                  <Bar dataKey="spent" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={24} />
                  {/* Remaining Layer */}
                  <Bar dataKey="remaining" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                  {/* Overbudget Layer (if any) to make it stand out or add height */}
                  <Bar dataKey="over" stackId="a" fill="#a7f3d0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparative Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <h3 className="text-lg font-bold text-[#1e293b] mb-6">Comparative Analysis</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 text-sm">Previous Period</h4>
                    <p className="text-xs text-gray-400">Last month's spending</p>
                  </div>
                </div>
                <span className="font-bold text-gray-700">{formatCurrency(selectedBudget.lastMonthSpent, currency)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 text-sm">Current Period</h4>
                    <p className="text-xs text-gray-400">This month's spending</p>
                  </div>
                </div>
                <span className="font-bold text-gray-700">{formatCurrency(selectedBudget.spentAmount, currency)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 text-sm">Variance</h4>
                    <p className="text-xs text-gray-400">Difference from previous</p>
                  </div>
                </div>
                <span className={`font-bold ${isVariancePositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {isVariancePositive ? '+' : ''}{formatCurrency(variance, currency)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
