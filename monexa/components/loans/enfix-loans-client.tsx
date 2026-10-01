"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  HandCoins,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  History,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoanForm } from "./loan-form";
import { Loan, LoanActivity, Repayment } from "@prisma/client";
import { RepaymentForm } from "./repayment-form";
import { AddLoanAmountForm } from "./add-loan-amount-form";

type LoanWithRepayments = Loan & {
  repayments: Repayment[];
  activities: LoanActivity[];
};

type TimelineItem = {
  id: string;
  date: Date;
  recordedAt: Date;
  label: string;
  notes: string | null;
  amountDelta: number;
  balanceAfter: number | null;
};

export function EnfixLoansClient({ loans, currency }: { loans: LoanWithRepayments[], currency: string }) {
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(loans[0]?.id || null);
  const [activeTab, setActiveTab] = useState<"BORROWED" | "LENT">("BORROWED");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddAmountDialogOpen, setIsAddAmountDialogOpen] = useState(false);

  const borrowedLoans = loans.filter(l => l.loanType === "BORROWED");
  const lentLoans = loans.filter(l => l.loanType === "LENT");
  const activeLoans = activeTab === "BORROWED" ? borrowedLoans : lentLoans;

  const selectedLoan = activeLoans.find(l => l.id === selectedLoanId) || activeLoans[0];

  const timeline: TimelineItem[] = selectedLoan ? (() => {
    const items: TimelineItem[] = [
      ...selectedLoan.activities.map((activity) => ({
        id: activity.id,
        date: new Date(activity.activityDate),
        recordedAt: new Date(activity.createdAt),
        label: activity.type === "CREATED"
          ? "Loan started"
          : activity.type === "ADDITION"
            ? selectedLoan.loanType === "BORROWED" ? "Borrowed more" : "Lent more"
            : activity.amountDelta >= 0 ? "Amount increased" : "Amount reduced",
        notes: activity.notes,
        amountDelta: activity.amountDelta,
        balanceAfter: activity.balanceAfter,
      })),
      ...selectedLoan.repayments.map((repayment) => ({
        id: repayment.id,
        date: new Date(repayment.paymentDate),
        recordedAt: new Date(repayment.createdAt),
        label: selectedLoan.loanType === "BORROWED" ? "You repaid" : "Repayment received",
        notes: repayment.notes,
        amountDelta: -repayment.amount,
        balanceAfter: null,
      })),
      ...(selectedLoan.activities.some((activity) => activity.type === "CREATED") ? [] : [{
        id: `created-${selectedLoan.id}`,
        date: new Date(selectedLoan.startDate),
        recordedAt: new Date(selectedLoan.createdAt),
        label: "Loan started",
        notes: selectedLoan.notes,
        amountDelta: selectedLoan.principalAmount
          - selectedLoan.activities.reduce((sum, activity) => sum + activity.amountDelta, 0),
        balanceAfter: null,
      }]),
    ].sort((a, b) => {
      const dateDifference = a.date.getTime() - b.date.getTime();
      return dateDifference || a.recordedAt.getTime() - b.recordedAt.getTime();
    });

    let runningBalance = 0;
    return items.map((item) => {
      runningBalance += item.amountDelta;
      return { ...item, balanceAfter: Math.max(runningBalance, 0) };
    }).reverse();
  })() : [];

  // "Total Borrowed" / "Total Lent" reflect the current outstanding balance
  // across every loan of that type (a fully repaid loan already carries a
  // balance of 0, so it naturally drops out without extra filtering).
  const totalBorrowed = borrowedLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const totalLent = lentLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const netOutstanding = totalLent - totalBorrowed;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "OVERDUE": return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-emerald-50 text-emerald-600";
      case "OVERDUE": return "bg-rose-50 text-rose-600";
      default: return "bg-amber-50 text-amber-600";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* Header & Stats in a white card */}
      <div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e293b]">Loans</h2>
              <p className="text-sm text-gray-400">Track money you owe and money owed to you.</p>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger render={
              <Button className="bg-[#1e293b] hover:bg-gray-800 text-white rounded-full px-6 h-11">
                <Plus className="mr-2 h-4 w-4" /> New Record
              </Button>
            } />
            <DialogContent className="sm:max-w-150 rounded-2xl">
              <DialogHeader>
                <DialogTitle>Record a New Loan</DialogTitle>
              </DialogHeader>
              <LoanForm onSuccess={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-rose-50 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600/80 mb-1">Total Borrowed</p>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalBorrowed, currency)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ArrowDownRight className="h-5 w-5 text-rose-500" />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600/80 mb-1">Total Lent</p>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalLent, currency)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600/80 mb-1">Net Position</p>
              <div className="text-2xl font-bold text-indigo-600">{netOutstanding > 0 ? "+" : ""}{formatCurrency(netOutstanding, currency)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <HandCoins className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left List */}
        <div className="w-full lg:w-87.5 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-4xl p-4 sm:p-6 shadow-sm border border-gray-50 h-auto lg:h-150 flex flex-col">

            <div className="flex bg-gray-50 rounded-full p-1 mb-6">
              <button
                onClick={() => { setActiveTab("BORROWED"); setSelectedLoanId(null); }}
                className={`flex-1 py-2 px-4 text-sm font-bold rounded-full transition-all ${activeTab === "BORROWED" ? 'bg-white text-[#1e293b] shadow-sm' : 'text-gray-400'}`}
              >
                Borrowed
              </button>
              <button
                onClick={() => { setActiveTab("LENT"); setSelectedLoanId(null); }}
                className={`flex-1 py-2 px-4 text-sm font-bold rounded-full transition-all ${activeTab === "LENT" ? 'bg-white text-[#1e293b] shadow-sm' : 'text-gray-400'}`}
              >
                Lent
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {activeLoans.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No {activeTab.toLowerCase()} loans found.
                </div>
              ) : (
                activeLoans.map(loan => {
                  const isSelected = selectedLoan?.id === loan.id;
                  const progress = loan.principalAmount > 0
                    ? Math.round(((loan.principalAmount - loan.balance) / loan.principalAmount) * 100)
                    : 0;

                  return (
                    <button
                      key={loan.id}
                      onClick={() => setSelectedLoanId(loan.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${isSelected
                        ? 'bg-indigo-50 border-indigo-100'
                        : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-[#1e293b]'}`}>{loan.personName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getStatusColor(loan.status)}`}>
                            {loan.status}
                          </span>
                        </div>
                        <div className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-[#1e293b]'}`}>
                          {formatCurrency(loan.balance, currency)}
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Details */}
        <div className="flex-1">
          {selectedLoan ? (
            <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 h-auto lg:h-150 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(selectedLoan.status)} flex items-center gap-1`}>
                      {getStatusIcon(selectedLoan.status)} {selectedLoan.status}
                    </span>
                    {selectedLoan.dueDate && (
                      <span className="text-xs text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-full">
                        <Calendar className="w-3 h-3 mr-1" /> Due {new Date(selectedLoan.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#1e293b]">{selectedLoan.personName}</h2>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      } />
                      <DialogContent className="sm:max-w-95 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Loan</DialogTitle>
                        </DialogHeader>
                        <LoanForm initialData={selectedLoan} onSuccess={() => setIsEditDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isAddAmountDialogOpen} onOpenChange={setIsAddAmountDialogOpen}>
                      <DialogTrigger render={
                        <Button variant="outline" className="h-8 rounded-full px-4 text-xs font-bold">
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Amount
                        </Button>
                      } />
                      <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            Add {selectedLoan.loanType === "BORROWED" ? "Borrowed" : "Lent"} Amount
                          </DialogTitle>
                        </DialogHeader>
                        <AddLoanAmountForm
                          loanId={selectedLoan.id}
                          loanType={selectedLoan.loanType}
                          onSuccess={() => setIsAddAmountDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  {selectedLoan.notes && <p className="text-sm text-gray-400 mt-1">{selectedLoan.notes}</p>}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Remaining Balance</p>
                  <h3 className="text-3xl font-bold text-[#1e293b]">{formatCurrency(selectedLoan.balance, currency)}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Principal Amount</p>
                  <p className="font-bold text-[#1e293b]">{formatCurrency(selectedLoan.principalAmount, currency)}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Interest Rate</p>
                  <p className="font-bold text-[#1e293b]">{selectedLoan.interestRate ? `${selectedLoan.interestRate}% APR` : '0%'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-bold text-[#1e293b]">Activity History</h3>
                </div>
                {selectedLoan.status !== "PAID" && (
                  <Dialog>
                    <DialogTrigger render={
                      <Button variant="outline" className="rounded-full h-8 px-4 text-xs font-bold">
                        Add Repayment
                      </Button>
                    } />
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Repayment</DialogTitle>
                      </DialogHeader>
                      <RepaymentForm loanId={selectedLoan.id} maxAmount={selectedLoan.balance} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="flex-1 overflow-auto scrollbar-thin border border-gray-100 rounded-2xl">
                {timeline.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No activity recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Activity</th>
                        <th className="text-right py-3 px-4 text-gray-500 font-medium">Change</th>
                        <th className="text-right py-3 px-4 text-gray-500 font-medium">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {timeline.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-[#1e293b]">
                            {item.date.toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-[#1e293b]">{item.label}</p>
                            {item.notes && <p className="mt-0.5 text-xs text-gray-400">{item.notes}</p>}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${item.amountDelta >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {item.amountDelta >= 0 ? "+" : "-"}{formatCurrency(Math.abs(item.amountDelta), currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-500">
                            {item.balanceAfter === null ? "—" : formatCurrency(item.balanceAfter, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 h-auto lg:h-150 flex flex-col items-center justify-center text-center">
              <Landmark className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-[#1e293b]">Select a Loan</h3>
              <p className="text-gray-400 max-w-sm mt-2">
                Click on a loan from the list to view its details and complete activity history.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
