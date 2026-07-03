"use client";

import { Loan, Repayment } from "@prisma/client";
import { LoanCard } from "./loan-card";
import { HandshakeIcon } from "lucide-react";

type LoanWithRepayments = Loan & {
  repayments: Repayment[];
};

interface LoanListProps {
  loans: LoanWithRepayments[];
  currency: string;
  emptyMessage?: string;
}

export function LoanList({ loans, currency, emptyMessage = "No loans found." }: LoanListProps) {
  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-950 border border-dashed rounded-xl shadow-sm text-center">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full mb-4">
          <HandshakeIcon className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No Loans</h3>
        <p className="text-zinc-500 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} currency={currency} />
      ))}
    </div>
  );
}
