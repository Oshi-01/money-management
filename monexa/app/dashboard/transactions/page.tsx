import { getTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { getEnfixBudgetsData } from "@/app/actions/budgets";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ArrowLeftRight } from "lucide-react";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";

export const metadata = {
  title: "Transactions - Monexa",
  description: "Manage your financial transactions",
};

export default async function TransactionsPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const page = typeof searchParams?.page === "string" ? parseInt(searchParams.page) : 1;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [transactionsData, categories, accounts, userSettings, budgetData] = await Promise.all([
    getTransactions(page, 50),
    getCategories(),
    getUserAccounts(),
    import("@/app/actions/settings").then(m => m.getUserSettings()),
    getEnfixBudgetsData(currentMonth)
  ]);

  const currency = userSettings?.currency || "USD";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* Header in a white card */}
      <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b]">Transactions</h2>
            <p className="text-sm text-gray-400">Track and manage your income and expenses.</p>
          </div>
        </div>

        <NewTransactionDialog
          categories={categories}
          accounts={accounts}
          budgets={budgetData.budgets}
          currency={currency}
        />
      </div>

      {/* Full Width List */}
      <div className="bg-white rounded-4xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50">
        <h3 className="text-xl font-bold text-[#1e293b] mb-6">Recent Transactions</h3>
        <TransactionList transactions={transactionsData.transactions} currency={currency} />
      </div>

    </div>
  );
}
