import { getUserSettings } from "@/app/actions/settings";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { Settings } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-gray-500 to-gray-700 shadow-md shadow-gray-500/20">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <SettingsForm user={userSettings} />
    </div>
  );
}
