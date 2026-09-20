import { getReportData } from "@/app/actions/reports";
import { getUserSettings } from "@/app/actions/settings";
import { ExpenseBreakdownChart } from "@/components/reports/expense-breakdown-chart";
import { CashFlowChart } from "@/components/reports/cash-flow-chart";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { formatMonthLabel, monthOrCurrent } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Reports & Analytics - Monexa",
  description: "Visualize and analyze your financial data.",
};

export default async function ReportsPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const month = monthOrCurrent(searchParams?.month);
  const periodLabel = formatMonthLabel(month);

  const [reportData, userSettings] = await Promise.all([
    getReportData(month),
    getUserSettings(),
  ]);

  const currency = userSettings?.currency || "USD";
  const { income, expense, net } = reportData.summary;

  const stats = [
    { label: "Income", value: income, icon: ArrowUpRight, tone: "bg-emerald-50 text-emerald-600", text: "text-emerald-600" },
    { label: "Expenses", value: expense, icon: ArrowDownRight, tone: "bg-rose-50 text-rose-600", text: "text-rose-600" },
    { label: "Net", value: net, icon: Scale, tone: "bg-indigo-50 text-indigo-600", text: net < 0 ? "text-rose-600" : "text-[#1e293b]" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header in a white card */}
      <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b]">Reports & Analytics</h2>
            <p className="text-sm text-gray-400">Dive deep into your financial habits and trends.</p>
          </div>
        </div>
        <MonthSwitcher month={month} />
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone, text }) => (
          <div key={label} className="flex items-center justify-between rounded-3xl border border-gray-50 bg-white p-5 shadow-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">{label} · {periodLabel}</p>
              <p className={`text-2xl font-bold tabular-nums ${text}`}>{formatCurrency(value, currency)}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col">
          <ExpenseBreakdownChart data={reportData.expenseBreakdown} currency={currency} periodLabel={periodLabel} />
        </div>

        <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col">
          <CashFlowChart data={reportData.cashFlow} currency={currency} periodLabel={periodLabel} />
        </div>
      </div>
    </div>
  );
}
