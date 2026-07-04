"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  User,
  Settings,
  CreditCard,
  Building2,
  ArrowUpRight,
  Download,
  Plus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";
import { createAccount } from "@/app/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Button } from "@/components/ui/button";

interface ProfileData {
  user: {
    name: string;
    email: string;
    image: string;
  };
  budget: {
    total: number;
    spent: number;
  };
  recentSpending: any[];
  accounts: any[];
}

export function EnfixProfileClient({ data, currency }: { data: ProfileData, currency: string }) {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState(data.accounts[0]?.id);
  const [activeTab, setActiveTab] = useState("Profile");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedAccount = data.accounts.find(a => a.id === selectedAccountId) || data.accounts[0];

  const budgetPercent = Math.min(Math.round((data.budget.spent / data.budget.total) * 100) || 0, 100);
  const remaining = Math.max(data.budget.total - data.budget.spent, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">

      {/* Left Sidebar: Profile Overview */}
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex flex-col">
          <h2 className="text-xl font-bold text-[#1e293b] mb-6">Profile Overview</h2>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0">
              <img src={data.user.image} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1e293b] leading-tight">{data.user.name}</h3>
              <p className="text-sm text-gray-400 mb-1">{data.user.email}</p>
            </div>
          </div>

          <div className="bg-[#f8fafc] rounded-2xl p-5 mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-gray-500">Monthly Budget</span>
              <span className="font-bold text-[#1e293b]">
                {formatCurrency(data.budget.spent, currency)} <span className="text-gray-400">/ {formatCurrency(data.budget.total, currency).replace(currency, '')}</span>
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-600">{budgetPercent}% spent</span>
              <span className="text-gray-400">{formatCurrency(remaining, currency)} remaining</span>
            </div>
          </div>

          <div className="mb-8 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1e293b]">Recent Spending</h3>
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                Chase Bank <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.recentSpending}>
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    dy={10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), "Spent"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-auto">
            <button
              onClick={() => setActiveTab("Profile")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors border ${activeTab === "Profile" ? 'border-emerald-500 text-[#1e293b]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("Accounts")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors border ${activeTab === "Accounts" ? 'border-emerald-500 text-[#1e293b]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
            >
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Accounts</span>
            </button>
            <button
              onClick={() => setActiveTab("Settings")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors border ${activeTab === "Settings" ? 'border-emerald-500 text-[#1e293b]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
            >
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Content: Connected Accounts */}
      <div className="flex-1">
        <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1e293b]">Accounts</h2>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Account
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Manual Account</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                  startTransition(async () => {
                    const res = await createAccount(formData);
                    if (res.error) {
                      toast.error(res.error);
                    } else {
                      toast.success(res.success);
                      setIsAddOpen(false);
                      router.refresh();
                    }
                  });
                }} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input id="name" name="name" placeholder="e.g. My Checking" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type (e.g. Primary, Credit)</Label>
                    <Input id="type" name="type" placeholder="Primary" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Prefix / Info (Optional)</Label>
                    <Input id="prefix" name="prefix" placeholder="**** 1234" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Initial Balance</Label>
                    <Input id="balance" name="balance" type="number" step="0.01" defaultValue={0} required />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Account"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {data.accounts.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#1e293b]">No Accounts Found</h3>
              <p className="text-gray-400 max-w-sm mx-auto mt-2">
                You haven't added any manual accounts yet. Click the button above to start tracking your balances.
              </p>
            </div>
          ) : (
            <>
              {/* Custom Tabs */}
              <div className="flex bg-emerald-50 rounded-full p-1 mb-8 overflow-x-auto">
                {data.accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-all whitespace-nowrap ${selectedAccountId === acc.id || (!selectedAccountId && acc.id === selectedAccount.id)
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-[#1e293b]'
                      }`}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>

              {/* Selected Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#1e293b]">{selectedAccount.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{selectedAccount.prefix}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-400">{formatCurrency(selectedAccount.balance, currency)}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-emerald-600 font-bold">{selectedAccount.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Big Chart Area */}
              <div className="h-[250px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedAccount.trend}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="point"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), "Balance"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      dot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 3 Stats Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 font-medium mb-1">Average</p>
                  <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedAccount.stats.average, currency)}</h4>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 font-medium mb-1">Highest</p>
                  <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedAccount.stats.highest, currency)}</h4>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 font-medium mb-1">Lowest</p>
                  <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedAccount.stats.lowest, currency)}</h4>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
