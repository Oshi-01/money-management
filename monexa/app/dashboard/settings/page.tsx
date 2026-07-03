import { getUserSettings } from "@/app/actions/settings";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata = {
  title: "Settings - Monexa",
  description: "Manage your Monexa account settings.",
};

export default async function SettingsPage() {
  const userSettings = await getUserSettings();

  if (!userSettings) {
    return null; // or redirect to login, but layout already handles auth
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <SettingsForm user={userSettings} />
    </div>
  );
}
