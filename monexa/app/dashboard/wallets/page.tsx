import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWallets } from "@/lib/services/wallets";
import { getUserSettings } from "@/app/actions/settings";
import { WalletsClient } from "@/components/wallets/wallets-client";

export const metadata = { title: "Wallets & cards - Monexa", description: "Track your mobile wallets and Visa cards." };

export default async function WalletsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [wallets, settings] = await Promise.all([getWallets(session.user.id), getUserSettings()]);
  return <WalletsClient wallets={wallets} currency={settings?.currency ?? "USD"} />;
}
