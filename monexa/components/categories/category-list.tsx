"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
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

  return (
    <div className="w-full rounded-md border bg-white dark:bg-gray-950 overflow-x-auto">
      <Table className="min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  {category.name}
                  {!category.userId && <Badge variant="secondary" className="ml-2 text-xs">System</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant={category.type === "INCOME" ? "default" : "destructive"}>
                    {category.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(category.id, !category.userId)}
                    disabled={isPending || !category.userId}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
