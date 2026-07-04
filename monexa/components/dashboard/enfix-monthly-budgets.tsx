import { ShoppingBag, Bus, GraduationCap, Flame } from "lucide-react";

interface BudgetWithSpent {
  id: string;
  amount: number;
  spent: number;
  category: { name: string };
}

interface EnfixMonthlyBudgetsProps {
  budgets: BudgetWithSpent[];
}

export function EnfixMonthlyBudgets({ budgets }: EnfixMonthlyBudgetsProps) {
  const getIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("grocery") || name.includes("food")) return <ShoppingBag className="h-4 w-4" />;
    if (name.includes("transport") || name.includes("bus")) return <Bus className="h-4 w-4" />;
    if (name.includes("education")) return <GraduationCap className="h-4 w-4" />;
    return <Flame className="h-4 w-4" />; // generic fallback
  };

  const getColorTheme = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("grocery") || name.includes("food")) return { bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-500" };
    if (name.includes("transport") || name.includes("bus")) return { bg: "bg-blue-400", light: "bg-blue-100", text: "text-blue-400" };
    if (name.includes("education")) return { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-500" };
    return { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-500" };
  };

  const displayBudgets = budgets;

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-[#1e293b] font-bold text-lg mb-4">Monthly Budgets</h2>
      
      {displayBudgets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white/50 rounded-3xl text-sm text-gray-400 min-h-[200px]">
          No budgets set for this month.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayBudgets.map((b) => {
          const theme = getColorTheme(b.category.name);
          const percent = Math.min(Math.round((b.spent / b.amount) * 100) || 0, 100);
          
          return (
            <div key={b.id} className="bg-white rounded-full px-5 py-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${theme.bg}`}>
                    {getIcon(b.category.name)}
                  </div>
                  <span className="font-bold text-[#1e293b] text-sm">{b.category.name}</span>
                </div>
                <div className="text-sm font-bold text-[#1e293b]">
                  {Math.round(b.spent)} <span className="text-gray-400 font-normal">/ {b.amount}</span>
                </div>
              </div>
              <div className="pl-11 pr-2">
                <div className={`h-2 w-full rounded-full ${theme.light} overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full ${theme.bg}`} 
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
