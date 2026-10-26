import { PageHeader } from "@/components/dashboard/page-header";
import { getCategories } from "@/app/actions/categories";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Categories - Monexa",
  description: "Manage your income and expense categories",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 pb-8">

      <PageHeader title="Categories" description="A place for every kind of transaction.">
        <Dialog>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-full px-6 h-11"><Plus className="mr-2 h-4 w-4" /> New Category</Button>} />
          <DialogContent className="sm:max-w-106.25 rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create a New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Full Width List */}
      <div className="app-panel p-4 sm:p-6">
        <h3 className="text-xl font-bold text-foreground mb-6">Your Categories</h3>
        <div className="max-w-4xl">
          <CategoryList categories={categories} />
        </div>
      </div>

    </div>
  );
}
