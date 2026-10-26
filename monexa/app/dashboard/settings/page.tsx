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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <Settings className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div>
          <h2 className="page-title">
            Settings
          </h2>
          <p className="page-description">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <SettingsForm user={userSettings} />
    </div>
  );
}
