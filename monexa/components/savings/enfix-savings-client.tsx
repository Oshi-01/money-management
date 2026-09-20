"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Target, Plus, Download, Calendar, ArrowRight, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SavingsForm } from "@/components/savings/savings-form";
import { AddFundsForm } from "@/components/savings/add-funds-form";
import { DeleteGoalButton } from "@/components/savings/delete-goal-button";
import { EditGoalButton } from "@/components/savings/edit-goal-button";

interface HistoryItem {
  id: string;
  date: string;
  wallet: string;
  description: string;
  amount: number;
}

interface WalletItem {
  name: string;
  amount: number;
  color: string;
}

interface EnfixSavingsGoalData {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: Date | null;
  remaining: number;
  monthsLeft: number;
  monthlyNeed: number;
  wallets: WalletItem[];
  history: HistoryItem[];
}

interface EnfixSavingsClientProps {
  goals: EnfixSavingsGoalData[];
  currency: string;
}

export function EnfixSavingsClient({ goals, currency }: EnfixSavingsClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(goals.length > 0 ? goals[0].id : null);

  const selectedGoal = goals.find(g => g.id === selectedId) || goals[0];

  if (!selectedGoal) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <Target className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Savings Goals Yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            Start saving for your next big purchase or milestone by setting up a savings goal.
          </p>
          <Dialog>
            <DialogTrigger render={
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6">
                <Plus className="mr-2 h-4 w-4" /> Add New Goal
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
              </DialogHeader>
              <SavingsForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  const percent = Math.min(Math.round((selectedGoal.savedAmount / selectedGoal.targetAmount) * 100) || 0, 100);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">

      {/* Left Sidebar: Goals List */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">

        <div className="space-y-4">
          {goals.map(g => {
            const isActive = g.id === selectedId;

            return (
              <div
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className={`cursor-pointer rounded-2xl p-5 transition-all ${isActive
                    ? 'bg-emerald-600 shadow-md text-white'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-transparent hover:border-emerald-100'
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{g.title}</h3>
                </div>
                <div className="flex items-center text-sm font-medium">
                  <span className={isActive ? 'text-white' : 'text-gray-900'}>
                    {formatCurrency(g.savedAmount, currency)}
                  </span>
                  <span className={`mx-1 ${isActive ? 'text-emerald-200' : 'text-gray-400'}`}>/</span>
                  <span className={isActive ? 'text-emerald-200' : 'text-gray-400'}>
                    {formatCurrency(g.targetAmount, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Dialog>
          <DialogTrigger render={
            <div className="cursor-pointer bg-white rounded-2xl p-5 flex items-center justify-between text-gray-700 font-bold hover:bg-emerald-50 transition-colors border border-dashed border-gray-200 mt-2">
              <span>Add new goals</span>
              <Plus className="w-5 h-5 text-emerald-500" />
            </div>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <SavingsForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Right Content: Goal Details */}
      <div className="flex-1 space-y-6">

        {/* Title Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e293b]">{selectedGoal.title}</h2>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger render={
                <Button variant="outline" className="rounded-full text-xs font-bold border-gray-200 h-8">
                  <Plus className="w-3 h-3 mr-1" /> Add Funds
                </Button>
              } />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Funds to {selectedGoal.title}</DialogTitle>
                </DialogHeader>
                <AddFundsForm goalId={selectedGoal.id} />
              </DialogContent>
            </Dialog>
            <EditGoalButton goal={selectedGoal} />
            <DeleteGoalButton id={selectedGoal.id} title={selectedGoal.title} />
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Saved</p>
              <h3 className="text-3xl font-bold text-[#1e293b]">{formatCurrency(selectedGoal.savedAmount, currency)}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 font-medium mb-1">Target</p>
              <h3 className="text-2xl font-bold text-[#1e293b]">{formatCurrency(selectedGoal.targetAmount, currency)}</h3>
            </div>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-1000"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-400 mt-2">
            <span>{percent}%</span>
            <span>{100 - percent}%</span>
          </div>
        </div>

        {/* 4-Column Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Target Amount</p>
            <h4 className="text-lg font-bold text-[#1e293b]">{formatCurrency(selectedGoal.targetAmount, currency)}</h4>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Remaining Amount</p>
            <h4 className="text-lg font-bold text-[#1e293b]">{formatCurrency(selectedGoal.remaining, currency)}</h4>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Time Left</p>
            <h4 className="text-lg font-bold text-[#1e293b]">
              {selectedGoal.deadline ? `${selectedGoal.monthsLeft} Months` : 'No deadline'}
            </h4>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Monthly Need</p>
            <h4 className="text-lg font-bold text-[#1e293b]">{formatCurrency(selectedGoal.monthlyNeed, currency)}</h4>
          </div>
        </div>

        {/* Available by Wallet */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h3 className="text-lg font-bold text-[#1e293b] mb-6">Available by Wallet</h3>

          <div className="space-y-6">
            {selectedGoal.wallets.map((wallet, index) => {
              const wPercent = selectedGoal.savedAmount > 0 ? (wallet.amount / selectedGoal.savedAmount) * 100 : 0;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${wallet.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold text-[#1e293b] mb-2">
                      <span>{wallet.name}</span>
                      <span>{formatCurrency(wallet.amount, currency).replace(/\.00$/, '')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${wallet.color}`}
                        style={{ width: `${wPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h3 className="text-lg font-bold text-[#1e293b] mb-6">History</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-[#1e293b] font-bold border-b border-gray-100">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Wallet</th>
                  <th className="pb-4">Description</th>
                  <th className="pb-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedGoal.history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No deposit history available.
                    </td>
                  </tr>
                ) : (
                  selectedGoal.history.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-4 text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 text-gray-400 flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-gray-200 bg-gray-50" />
                        {tx.wallet}
                      </td>
                      <td className="py-4 text-gray-500">{tx.description}</td>
                      <td className="py-4 text-right">
                        <div className="font-bold text-[#1e293b]">+{formatCurrency(tx.amount, currency)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
