"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight, ArrowDownRight, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  userId: string | null;
};

export function CategoryList({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, isSystem: boolean) => {
    if (isSystem) {
      toast.error("Cannot delete system categories");
      return;
    }
    
    if (confirm("Are you sure you want to delete this category?")) {
      startTransition(async () => {
        const result = await deleteCategory(id);
        if (result.error) toast.error(result.error);
        if (result.success) toast.success(result.success);
      });
    }
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
          <FolderOpen className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No categories yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first category to organize transactions.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => {
        const isIncome = category.type === "INCOME";
        const isSystem = !category.userId;
        return (
          <div
            key={category.id}
            className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-sm hover:border-gray-200 group"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isIncome 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "bg-rose-50 text-rose-600"
              }`}>
                {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#1e293b]">{category.name}</p>
                  {isSystem && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200">System</Badge>}
                </div>
                <p className={`text-xs font-medium mt-0.5 ${
                  isIncome ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {category.type}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDelete(category.id, isSystem)}
              disabled={isPending || isSystem}
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-0 disabled:group-hover:opacity-30 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
