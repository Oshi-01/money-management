import { getSavingsGoals } from "@/app/actions/savings";
import { getUserSettings } from "@/app/actions/settings";
import { SavingsForm } from "@/components/savings/savings-form";
import { SavingsList } from "@/components/savings/savings-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Savings Goals - Monexa",
  description: "Track and achieve your financial goals.",
};

export default async function SavingsPage() {
  const [savingsData, userSettings] = await Promise.all([
    getSavingsGoals(),
    getUserSettings(),
  ]);
  
  const currency = userSettings?.currency || "USD";
  const goals = savingsData.goals || [];

  const totalTarget = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const totalSaved = goals.reduce((acc, goal) => acc + goal.savedAmount, 0);
  
  const totalPercent = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Savings Goals</h2>
          <p className="text-muted-foreground">
            Set targets and track your progress towards financial freedom.
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={
            <Button className="w-full sm:w-auto" />
          }>
            <Plus className="mr-2 h-4 w-4" /> Add Goal
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Savings Goal</DialogTitle>
            </DialogHeader>
            <SavingsForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalSaved, currency)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalTarget, currency)}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{totalPercent}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Goals</h3>
        <SavingsList goals={goals} currency={currency} />
      </div>
    </div>
  );
}
