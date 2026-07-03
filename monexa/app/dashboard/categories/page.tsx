import { getCategories } from "@/app/actions/categories";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Categories - Monexa",
  description: "Manage your income and expense categories",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Categories</h2>
        <p className="text-muted-foreground">
          Manage the categories you use for your transactions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
              <CardDescription>Create a custom category for your transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Your Categories</CardTitle>
              <CardDescription>A list of all your custom and system categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryList categories={categories} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
