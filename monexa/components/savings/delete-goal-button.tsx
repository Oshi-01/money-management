"use client";

import { useState, useTransition } from "react";
import { deleteSavingsGoal } from "@/app/actions/savings";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteGoalButton({ id, title }: { id: string; title?: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSavingsGoal(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label="Delete goal"
        className="text-red-500 hover:text-red-700 hover:bg-red-50 border-gray-200 h-8 w-8 rounded-full"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title ? `Delete "${title}"?` : "Delete this savings goal?"}
        description="The goal and the amount you've tracked toward it will be removed. This can't be undone."
        confirmLabel="Delete goal"
        onConfirm={handleDelete}
        pending={isPending}
      />
    </>
  );
}
