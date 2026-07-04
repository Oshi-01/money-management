import { getCategories } from "@/app/actions/categories";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { Tags, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Categories - Monexa",
  description: "Manage your income and expense categories",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      
      {/* Header in a white card */}
      <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Tags className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1e293b]">Categories</h2>
            <p className="text-sm text-gray-400">Manage the categories you use for your transactions.</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="bg-[#1e293b] hover:bg-gray-800 text-white rounded-full px-6 h-11"><Plus className="mr-2 h-4 w-4" /> New Category</Button>} />
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create a New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Full Width List */}
      <div className="bg-white rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50">
        <h3 className="text-xl font-bold text-[#1e293b] mb-6">Your Categories</h3>
        <div className="max-w-4xl">
          <CategoryList categories={categories} />
        </div>
      </div>

    </div>
  );
}
