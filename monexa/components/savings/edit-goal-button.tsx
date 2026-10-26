"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SavingsForm, type EditableGoal } from "@/components/savings/savings-form";

export function EditGoalButton({ goal }: { goal: EditableGoal }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={`Edit ${goal.title}`}
        onClick={() => setOpen(true)}
        className="h-8 w-8 rounded-full border-border text-muted-foreground hover:bg-primary-soft hover:text-primary"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Savings Goal</DialogTitle>
          </DialogHeader>
          {/* key: remount when reopened or the goal changes, so the form shows fresh values */}
          <SavingsForm key={`${goal.id}-${open}`} goal={goal} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
