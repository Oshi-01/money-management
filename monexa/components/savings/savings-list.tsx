"use client";

import { SavingsCard } from "./savings-card";

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: Date | null;
}

export function SavingsList({ goals, currency }: { goals: SavingsGoal[], currency: string }) {
  if (goals.length === 0) {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-white dark:bg-gray-950/50">
        <p className="text-sm text-muted-foreground">You haven't set any savings goals yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <SavingsCard key={goal.id} goal={goal} currency={currency} />
      ))}
    </div>
  );
}
