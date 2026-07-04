import { getTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { getUserAccounts } from "@/app/actions/accounts";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  const [transactionsData, categories, accounts, userSettings] = await Promise.all([
    getTransactions(page, 50),
    getCategories(),
    getUserAccounts(),
    import("@/app/actions/settings").then(m => m.getUserSettings())
  ]);

  const currency = userSettings?.currency || "USD";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      
      {/* Header in a white card */}
      <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b]">Transactions</h2>
            <p className="text-sm text-gray-400">Track and manage your income and expenses.</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="bg-[#1e293b] hover:bg-gray-800 text-white rounded-full px-6 h-11"><Plus className="mr-2 h-4 w-4" /> New Transaction</Button>} />
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Record a New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm categories={categories} accounts={accounts} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Full Width List */}
      <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50">
        <h3 className="text-xl font-bold text-[#1e293b] mb-6">Recent Transactions</h3>
        <TransactionList transactions={transactionsData.transactions} currency={currency} />
      </div>

    </div>
  );
}
