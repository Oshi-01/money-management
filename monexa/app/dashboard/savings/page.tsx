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
          <h2 className="page-title">Goals</h2>
          <p className="page-description">
            Save toward the things that matter.
          </p>
        </div>
      </div>

      <EnfixSavingsClient goals={goals as any} currency={currency} />
    </div>
  );
}
