import { getLoans } from "@/app/actions/loans";
import { getUserSettings } from "@/app/actions/settings";
import { LoanList } from "@/components/loans/loan-list";
import { LoanForm } from "@/components/loans/loan-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, HandCoins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Loans - Monexa",
  description: "Track money you've borrowed and lent",
};

export default async function LoansPage() {
  const [loans, userSettings] = await Promise.all([
    getLoans(),
    getUserSettings()
  ]);

  const currency = userSettings?.currency || "USD";

  const borrowedLoans = loans.filter(l => l.loanType === "BORROWED");
  const lentLoans = loans.filter(l => l.loanType === "LENT");

  const totalBorrowed = borrowedLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const totalLent = lentLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const netOutstanding = totalLent - totalBorrowed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Loans</h2>
          <p className="text-muted-foreground">
            Track money you owe and money owed to you.
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="shrink-0" />}>
            + New Loan Record
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Record a New Loan</DialogTitle>
              <DialogDescription>
                Track money you have borrowed or lent to someone.
              </DialogDescription>
            </DialogHeader>
            <LoanForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed (To Pay)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalBorrowed, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding balance you owe
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lent (To Receive)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalLent, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding balance owed to you
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              netOutstanding > 0 ? "text-emerald-600 dark:text-emerald-400" : 
              netOutstanding < 0 ? "text-rose-600 dark:text-rose-400" : 
              "text-gray-900 dark:text-white"
            }`}>
              {netOutstanding > 0 ? "+" : ""}{formatCurrency(netOutstanding, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your overall lending balance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="borrowed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="borrowed">Loans Taken ({borrowedLoans.length})</TabsTrigger>
          <TabsTrigger value="lent">Loans Given ({lentLoans.length})</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="borrowed" className="m-0">
            <LoanList 
              loans={borrowedLoans} 
              currency={currency} 
              emptyMessage="You don't have any outstanding borrowed loans. Great job!" 
            />
          </TabsContent>
          
          <TabsContent value="lent" className="m-0">
            <LoanList 
              loans={lentLoans} 
              currency={currency} 
              emptyMessage="You haven't lent money to anyone." 
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
