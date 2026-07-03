import { getReportData } from "@/app/actions/reports";
import { getUserSettings } from "@/app/actions/settings";
import { ExpenseBreakdownChart } from "@/components/reports/expense-breakdown-chart";
import { CashFlowChart } from "@/components/reports/cash-flow-chart";

export const metadata = {
  title: "Reports & Analytics - Monexa",
  description: "Visualize and analyze your financial data.",
};

export default async function ReportsPage() {
  const [reportData, userSettings] = await Promise.all([
    getReportData(),
    getUserSettings(),
  ]);
  
  const currency = userSettings?.currency || "USD";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Reports & Analytics</h2>
        <p className="text-muted-foreground">
          Dive deep into your financial habits and trends.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <ExpenseBreakdownChart data={reportData.expenseBreakdown} currency={currency} />
        </div>
        
        <div className="md:col-span-1">
          <CashFlowChart data={reportData.cashFlow} currency={currency} />
        </div>
      </div>
    </div>
  );
}
