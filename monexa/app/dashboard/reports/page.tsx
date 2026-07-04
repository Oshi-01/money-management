import { getReportData } from "@/app/actions/reports";
import { getUserSettings } from "@/app/actions/settings";
import { ExpenseBreakdownChart } from "@/components/reports/expense-breakdown-chart";
import { CashFlowChart } from "@/components/reports/cash-flow-chart";
import { TrendingUp } from "lucide-react";

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
      {/* Header in a white card */}
      <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b]">Reports & Analytics</h2>
            <p className="text-sm text-gray-400">Dive deep into your financial habits and trends.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col">
          <ExpenseBreakdownChart data={reportData.expenseBreakdown} currency={currency} />
        </div>

        <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col">
          <CashFlowChart data={reportData.cashFlow} currency={currency} />
        </div>
      </div>
    </div>
  );
}
