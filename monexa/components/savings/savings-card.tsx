"use client";

import { useTransition, useState } from "react";
import { deleteSavingsGoal } from "@/app/actions/savings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddFundsForm } from "./add-funds-form";

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: Date | null;
}

interface SavingsCardProps {
  goal: SavingsGoal;
  currency: string;
}

export function SavingsCard({ goal, currency }: SavingsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this savings goal?")) {
      startTransition(async () => {
        const result = await deleteSavingsGoal(goal.id);
        if (result.error) toast.error(result.error);
        if (result.success) toast.success(result.success);
      });
    }
  };

  const percentComplete = Math.min(
    Math.round((goal.savedAmount / goal.targetAmount) * 100), 
    100
  );
  
  const isComplete = percentComplete === 100;

  return (
    <Card className="flex flex-col border-none shadow-sm h-full hover:shadow-md transition-shadow relative overflow-hidden">
      {isComplete && (
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
          <div className="absolute transform rotate-45 bg-emerald-500 text-white text-[10px] font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-sm">
            COMPLETED
          </div>
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center">
            {isComplete ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            ) : (
              <Target className="mr-2 h-4 w-4 text-blue-500" />
            )}
            {goal.title}
          </CardTitle>
          {goal.deadline && (
            <CardDescription className="text-xs">
              Target: {new Date(goal.deadline).toLocaleDateString()}
            </CardDescription>
          )}
        </div>
        <div className="flex -mt-2 -mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pt-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(goal.savedAmount, currency)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              of {formatCurrency(goal.targetAmount, currency)} target
            </div>
          </div>
          <div className="text-sm font-semibold">
            {percentComplete}%
          </div>
        </div>
        
        <Progress 
          value={percentComplete} 
          className="h-2 mt-2 mb-4" 
        />
        
        <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
          <DialogTrigger render={
            <Button 
              variant={isComplete ? "outline" : "default"} 
              className="w-full mt-auto"
              disabled={isComplete}
            />
          }>
            <PlusCircle className="mr-2 h-4 w-4" /> 
            {isComplete ? "Goal Reached" : "Add Funds"}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Funds to {goal.title}</DialogTitle>
            </DialogHeader>
            <AddFundsForm 
              goalId={goal.id} 
              onSuccess={() => setIsAddFundsOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
