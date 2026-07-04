import { formatCurrency } from "@/lib/utils";
import { CreditCard, ShoppingBag, Landmark, Scissors, FileText, Car, GraduationCap } from "lucide-react";

type RecentTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  category: { name: string } | null;
};

interface EnfixTransactionHistoryProps {
  transactions: RecentTransaction[];
  currency: string;
}

export function EnfixTransactionHistory({ transactions, currency }: EnfixTransactionHistoryProps) {
  const getIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("shop") || name.includes("grocery")) return <ShoppingBag className="h-4 w-4" />;
    if (name.includes("transfer") || name.includes("bank")) return <Landmark className="h-4 w-4" />;
    if (name.includes("beauty")) return <Scissors className="h-4 w-4" />;
    if (name.includes("bill") || name.includes("fee")) return <FileText className="h-4 w-4" />;
    if (name.includes("car") || name.includes("transport")) return <Car className="h-4 w-4" />;
    if (name.includes("education")) return <GraduationCap className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  const getColorClass = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("beauty")) return "bg-emerald-500 text-white";
    if (name.includes("bill")) return "bg-teal-500 text-white";
    if (name.includes("car")) return "bg-blue-400 text-white";
    if (name.includes("education")) return "bg-blue-500 text-white";
    return "bg-gray-500 text-white";
  };

  return (
    <div className="w-full">
      <h2 className="text-[#1e293b] font-bold text-lg mb-4">Transaction History</h2>
      
      {/* Header Row */}
      <div className="grid grid-cols-5 text-[13px] font-medium text-gray-500 px-6 py-3 mb-2 bg-white/50 rounded-full">
        <div className="col-span-1">Category</div>
        <div className="col-span-1">Date</div>
        <div className="col-span-2">Description</div>
        <div className="col-span-1 flex justify-between">
          <span>Amount</span>
          <span>Currency</span>
        </div>
      </div>

      {/* Transaction Rows */}
      <div className="flex flex-col gap-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-full px-6 py-6 text-center text-sm text-gray-400 shadow-sm">
            No transactions found.
          </div>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="grid grid-cols-5 items-center text-sm px-6 py-4 bg-white rounded-full shadow-sm">
              <div className="col-span-1 flex items-center gap-3 text-gray-600 font-medium">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getColorClass(t.category?.name || '')}`}>
                  {getIcon(t.category?.name || '')}
                </div>
                {t.category?.name || "Other"}
              </div>
              <div className="col-span-1 text-gray-500">
                {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '.')}
              </div>
              <div className="col-span-2 text-gray-500 truncate pr-4">
                {t.description}
              </div>
              <div className="col-span-1 flex justify-between font-medium">
                <span className={t.type === 'EXPENSE' ? 'text-gray-700' : 'text-emerald-600'}>
                  {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount, currency).replace(/[^0-9.]/g, '')}
                </span>
                <span className="text-gray-400 font-normal">{currency}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
