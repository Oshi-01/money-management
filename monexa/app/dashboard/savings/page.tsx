import { getEnfixSavingsData } from "@/app/actions/savings";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixSavingsClient } from "@/components/savings/enfix-savings-client";

export const metadata = {
  title: "Savings Goals - Monexa",
  description: "Track and achieve your financial goals.",
};

export default async function SavingsPage() {
  const [savingsData, userSettings] = await Promise.all([
    getEnfixSavingsData(),
    getUserSettings(),
  ]);

  const currency = userSettings?.currency || "USD";
  const goals = savingsData.goals || [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1e293b]">Goals</h2>
          <p className="text-sm text-gray-400">
            Save toward the things that matter.
          </p>
        </div>
        <div className="text-sm text-gray-400 font-medium">
          Home <span className="mx-2">&gt;</span> <span className="text-emerald-600">Goals</span>
        </div>
      </div>

      <EnfixSavingsClient goals={goals as any} currency={currency} />
    </div>
  );
}
