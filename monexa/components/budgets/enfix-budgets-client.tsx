"use client";

import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { Carrot, Target, Wallet, Download, Plus, AlertCircle, ShoppingBag, Car, GraduationCap, DollarSign, Shirt, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteBudget } from "@/app/actions/budgets";
import { toast } from "sonner";

interface BudgetCategory {
  id: string;
  name: string;
  type: string;
}

interface EnfixBudgetPeriodData {
  totalBudget: number;
  spent: number;
  lastPeriodSpent: number;
  isOverBudget: boolean;
  chart: { month: string; fullMonth: string; spent: number; budget: number }[];
}

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
  periods: {
    weekly: EnfixBudgetPeriodData;
    yearly: EnfixBudgetPeriodData;
  };
}

type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

interface EnfixBudgetsClientProps {
  budgets: EnfixBudgetCategoryData[];
  currency: string;
  currentMonth: string;
  categories: BudgetCategory[];
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

const PERIOD_LABELS: Record<BudgetPeriod, { previous: string; current: string; previousSub: string; currentSub: string; unit: string }> = {
  WEEKLY: { previous: "Previous Week", current: "Current Week", previousSub: "Last week's spending", currentSub: "This week's spending", unit: "week" },
  MONTHLY: { previous: "Previous Period", current: "Current Period", previousSub: "Last month's spending", currentSub: "This month's spending", unit: "month" },
  YEARLY: { previous: "Previous Year", current: "Current Year", previousSub: "Last year's spending", currentSub: "This year's spending", unit: "year" },
};

export function EnfixBudgetsClient({ budgets, currency, currentMonth, categories }: EnfixBudgetsClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(budgets.length > 0 ? budgets[0].id : null);
  const [activePeriod, setActivePeriod] = useState<BudgetPeriod>("MONTHLY");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const selectedBudget = budgets.find(b => b.id === selectedId) || budgets[0];

  if (!selectedBudget) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <Target className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Budgets Yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            You haven&apos;t set up any budgets for this month. Start by adding a new budget limit for your categories.
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

  // Resolve the figures for whichever period tab is active.
  const periodView = activePeriod === "WEEKLY"
    ? {
      totalBudget: selectedBudget.periods.weekly.totalBudget,
      spent: selectedBudget.periods.weekly.spent,
      lastPeriodSpent: selectedBudget.periods.weekly.lastPeriodSpent,
      isOverBudget: selectedBudget.periods.weekly.isOverBudget,
      history: selectedBudget.periods.weekly.chart,
    }
    : activePeriod === "YEARLY"
    ? {
      totalBudget: selectedBudget.periods.yearly.totalBudget,
      spent: selectedBudget.periods.yearly.spent,
      lastPeriodSpent: selectedBudget.periods.yearly.lastPeriodSpent,
      isOverBudget: selectedBudget.periods.yearly.isOverBudget,
      history: selectedBudget.periods.yearly.chart,
    }
    : {
      totalBudget: selectedBudget.amount,
      spent: selectedBudget.spentAmount,
      lastPeriodSpent: selectedBudget.lastMonthSpent,
      isOverBudget: selectedBudget.isOverBudget,
      history: selectedBudget.history,
    };

  const percent = Math.min(Math.round((periodView.spent / periodView.totalBudget) * 100) || 0, 100);
  const remaining = Math.max(periodView.totalBudget - periodView.spent, 0);

  // Prepare chart data
  const chartData = periodView.history.map(h => ({
    month: h.month,
    spent: h.spent,
    remaining: Math.max(h.budget - h.spent, 0),
    over: h.spent > h.budget ? h.spent - h.budget : 0
  }));

  // Comparative analysis calculations
  const variance = periodView.spent - periodView.lastPeriodSpent;
  const isVariancePositive = variance > 0; // More spent this period than the previous one
  const periodLabels = PERIOD_LABELS[activePeriod];

  const confirmDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteBudget(selectedBudget.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
      setDeleting(false);
      setSelectedId(budgets.find((budget) => budget.id !== selectedBudget.id)?.id ?? null);
    });
  };

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
                    className={`h-full rounded-full ${
                      isActive ? 'bg-white' : b.isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${bPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-medium">
                  <span>{bPercent}%</span>
                  <span className={`flex items-center gap-1 ${b.isOverBudget ? (isActive ? 'text-white' : 'text-rose-500') : ''}`}>
                    {b.isOverBudget && <AlertCircle className="w-3 h-3" />}
                    {b.isOverBudget ? 'Over budget' : 'On track'}
                  </span>
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1e293b]">{selectedBudget.category.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${selectedBudget.category.name} budget`}
                onClick={() => setEditing(true)}
                className="h-8 w-8 rounded-full text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${selectedBudget.category.name} budget`}
                onClick={() => setDeleting(true)}
                className="h-8 w-8 rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400">Budget overview and analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
              {(["WEEKLY", "MONTHLY", "YEARLY"] as BudgetPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${
                    activePeriod === period
                      ? "text-white bg-emerald-600"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {period.charAt(0) + period.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Over-budget warning */}
        {periodView.isOverBudget && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              You&apos;ve gone {formatCurrency(periodView.spent - periodView.totalBudget, currency)} over your{" "}
              {periodLabels.unit}ly {selectedBudget.category.name} budget.
            </p>
          </div>
        )}

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Total Budget</p>
              <h3 className="text-xl font-bold text-[#1e293b]">{formatCurrency(periodView.totalBudget, currency)}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Spent</p>
              <h3 className="text-xl font-bold text-[#1e293b]">{formatCurrency(periodView.spent, currency)}</h3>
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
            <span>{formatCurrency(periodView.spent, currency)} spent</span>
            <span>{formatCurrency(periodView.totalBudget, currency)} total</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${periodView.isOverBudget ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold mt-2">
            <span className={periodView.isOverBudget ? 'text-rose-500' : 'text-amber-500'}>
              {percent}% of budget used
            </span>
            <span className="text-gray-400">
              {periodView.isOverBudget ? '0 remaining' : `${formatCurrency(remaining, currency)} remaining`}
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
                    <h4 className="font-bold text-gray-700 text-sm">{periodLabels.previous}</h4>
                    <p className="text-xs text-gray-400">{periodLabels.previousSub}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-700">{formatCurrency(periodView.lastPeriodSpent, currency)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700 text-sm">{periodLabels.current}</h4>
                    <p className="text-xs text-gray-400">{periodLabels.currentSub}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-700">{formatCurrency(periodView.spent, currency)}</span>
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

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          <BudgetForm
            key={selectedBudget.id}
            categories={categories}
            currentMonth={currentMonth}
            budget={{
              id: selectedBudget.id,
              categoryId: selectedBudget.categoryId,
              amount: selectedBudget.amount,
              month: currentMonth,
            }}
            onSuccess={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${selectedBudget.category.name} budget?`}
        description={`This removes the budget limit for ${selectedBudget.category.name} in ${currentMonth}. Your transactions will not be deleted.`}
        confirmLabel="Delete budget"
        onConfirm={confirmDelete}
        pending={isDeleting}
      />
    </div>
  );
}
