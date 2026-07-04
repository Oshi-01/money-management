import { formatCurrency } from "@/lib/utils";

export interface SummaryCardsProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  currency: string;
  spendingsBreakdown?: { percent: number; colorClass: string; colorHex: string }[];
  savingsTrend?: { month: string; net: number }[];
}

export function SummaryCards({
  balance,
  totalIncome,
  totalExpense,
  currency,
  spendingsBreakdown = [],
  savingsTrend = []
}: SummaryCardsProps) {

  // Calculate SVG path for savings trend
  const generatePath = () => {
    if (!savingsTrend || savingsTrend.length === 0) {
      return "M0,30 L20,10 L40,35 L60,25 L80,35 L100,20";
    }

    const values = savingsTrend.map(t => t.net);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 100); // Avoid division by zero
    const range = max - min || 1;

    // SVG viewBox is 0 0 100 40. We want to map values to Y between 5 and 35.
    const pts = values.map((val, i) => {
      const x = (i / (values.length - 1)) * 100;
      const normalizedY = (val - min) / range;
      // Invert Y axis (0 is top, 40 is bottom)
      const y = 35 - (normalizedY * 30);
      return `${x},${y}`;
    });

    return `M${pts.join(" L")}`;
  };

  const pathD = generatePath();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden h-[180px]">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Spendings</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-medium text-gray-900">{formatCurrency(totalExpense, currency)}</span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">-12%</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 mt-auto h-16 w-full pt-4">
          {spendingsBreakdown.length > 0 ? (
            spendingsBreakdown.map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 w-full h-full justify-end">
                <span className="text-[9px] text-gray-400 font-mono">{bar.percent}%</span>
                <div
                  className={`w-full rounded-sm ${bar.colorClass}`}
                  style={{ height: `${Math.max(bar.percent, 2)}%` }}
                />
              </div>
            ))
          ) : (
            <div className="w-full text-center text-xs text-gray-400 pb-2">No expenses yet</div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden h-[180px]">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Savings</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-medium text-gray-900">{formatCurrency(balance, currency)}</span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">-2%</span>
          </div>
        </div>

        <div className="mt-auto h-20 relative w-full flex flex-col justify-end pt-4">
          <svg className="w-full h-12 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            {savingsTrend.length > 0 && (
              <path d={`${pathD} L100,40 L0,40 Z`} fill="url(#savingsGrad)" />
            )}
            <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-2 w-full">
            {savingsTrend.length > 0
              ? savingsTrend.map((t, i) => <span key={i}>{t.month}</span>)
              : <><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
