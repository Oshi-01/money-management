"use client";

import { useTransition } from "react";
import { deleteSavingsGoal } from "@/app/actions/savings";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteGoalButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this savings goal?")) {
      startTransition(async () => {
        const result = await deleteSavingsGoal(id);
        if (result.error) toast.error(result.error);
        if (result.success) toast.success(result.success);
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="text-red-500 hover:text-red-700 hover:bg-red-50 border-gray-200 h-8 w-8 rounded-full"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
