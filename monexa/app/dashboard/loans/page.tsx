import { getLoans } from "@/app/actions/loans";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixLoansClient } from "@/components/loans/enfix-loans-client";

export const metadata = {
  title: "Loans - Monexa",
  description: "Track money you've borrowed and lent",
};

export default async function LoansPage() {
  const [loans, userSettings] = await Promise.all([
    getLoans(),
    getUserSettings()
  ]);

  const currency = userSettings?.currency || "USD";

  return <EnfixLoansClient loans={loans} currency={currency} />;
}
