"use client";

import { formatCurrency } from "@/lib/utils";
import { Loan, Repayment } from "@prisma/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UserIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { RepaymentForm } from "./repayment-form";
import { deleteLoan } from "@/app/actions/loans";

type LoanWithRepayments = Loan & {
  repayments: Repayment[];
};

interface LoanCardProps {
  loan: LoanWithRepayments;
  currency: string;
}

export function LoanCard({ loan, currency }: LoanCardProps) {
  const [isRepaymentOpen, setIsRepaymentOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const amountPaid = loan.principalAmount - loan.balance;
  const progressPercentage = (amountPaid / loan.principalAmount) * 100;
  
  const isBorrowed = loan.loanType === "BORROWED";
  const isPaid = loan.status === "PAID";
  const isOverdue = loan.status === "OVERDUE" || (loan.dueDate && new Date(loan.dueDate) < new Date() && !isPaid);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this loan? This action cannot be undone.")) {
      setIsDeleting(true);
      await deleteLoan(loan.id);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col p-5 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${isBorrowed ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-base text-zinc-900 dark:text-zinc-100">{loan.personName}</h3>
            <div className="flex items-center text-xs text-zinc-500 space-x-2 mt-1">
              <span className="flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {new Date(loan.startDate).toLocaleDateString()}
              </span>
              {loan.dueDate && (
                <span className={`flex items-center ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                  • Due: {new Date(loan.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isPaid ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Paid</Badge>
          ) : isOverdue ? (
            <Badge variant="destructive">Overdue</Badge>
          ) : (
            <Badge variant="secondary">Active</Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />}>
              <MoreVerticalIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 cursor-pointer" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Loan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Principal Amount</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(loan.principalAmount, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium mb-1">Remaining Balance</p>
          <p className={`font-semibold ${loan.balance > 0 ? (isBorrowed ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-zinc-900 dark:text-zinc-100'}`}>
            {formatCurrency(loan.balance, currency)}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-zinc-500 font-medium">{progressPercentage.toFixed(0)}% Repaid</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">{formatCurrency(amountPaid, currency)}</span>
        </div>
        <Progress value={progressPercentage} className="h-2 mb-4" />
        
        {!isPaid && (
          <Dialog open={isRepaymentOpen} onOpenChange={setIsRepaymentOpen}>
            <DialogTrigger render={<Button variant="outline" className="w-full text-sm font-medium border-dashed border-2 hover:bg-zinc-50 dark:hover:bg-zinc-900" />}>
              + Record Repayment
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Record Repayment</DialogTitle>
                <DialogDescription>
                  Log a payment {isBorrowed ? 'made to' : 'received from'} {loan.personName}.
                </DialogDescription>
              </DialogHeader>
              <RepaymentForm 
                loanId={loan.id} 
                maxAmount={loan.balance} 
                onSuccess={() => setIsRepaymentOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
