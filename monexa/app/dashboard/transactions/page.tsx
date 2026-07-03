import { getTransactions } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  
  const [transactionsData, categories, userSettings] = await Promise.all([
    getTransactions(page, 50),
    getCategories(),
    import("@/app/actions/settings").then(m => m.getUserSettings())
  ]);
  
  const currency = userSettings?.currency || "USD";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Transactions</h2>
        <p className="text-muted-foreground">
          Track and manage your income and expenses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Record a new income or expense.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm categories={categories} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4 min-w-0">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactionsData.transactions} currency={currency} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
