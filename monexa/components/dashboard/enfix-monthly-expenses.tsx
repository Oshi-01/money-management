import { formatCurrency } from "@/lib/utils";

interface SpendingBreakdown {
  name: string;
  amount: number;
  percent: number;
  colorHex: string;
}

interface EnfixMonthlyExpensesProps {
  breakdown: SpendingBreakdown[];
  currency?: string;
}

export function EnfixMonthlyExpenses({ breakdown, currency = "USD" }: EnfixMonthlyExpensesProps) {
  const displayBreakdown = breakdown;

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-[#1e293b] font-bold text-lg mb-6">Monthly Expenses</h2>
      
      {displayBreakdown.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white/50 rounded-3xl text-sm text-gray-400 min-h-[200px]">
          No expenses recorded this month.
        </div>
      ) : (
        <>
          {/* Stacked Horizontal Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex mb-8">
        {displayBreakdown.map((item, i) => (
          <div 
            key={i} 
            style={{ width: `${Math.max(item.percent, 5)}%`, backgroundColor: item.colorHex }}
            className="h-full"
          />
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-5">
        {displayBreakdown.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.colorHex }}
              />
              {item.name}
            </div>
            <div className="text-sm">
              <span className="text-gray-400 mr-3">{formatCurrency(item.amount, currency).replace(/\.00$/, '')}</span>
              <span className="font-bold text-[#1e293b]">{item.percent}%</span>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
