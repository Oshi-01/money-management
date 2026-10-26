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
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-dashed rounded-xl shadow-sm text-center">
        <div className="bg-muted p-4 rounded-full mb-4">
          <HandshakeIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No Loans</h3>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
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
