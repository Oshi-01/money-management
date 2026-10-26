import { getEnfixProfileData } from "@/app/actions/profile";
import { getUserSettings } from "@/app/actions/settings";
import { EnfixProfileClient } from "@/components/profile/enfix-profile-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile - Monexa",
  description: "Manage your profile and connected accounts.",
};

export default async function ProfilePage() {
  const [profileData, userSettings] = await Promise.all([
    getEnfixProfileData(),
    getUserSettings(),
  ]);

  if (!profileData) {
    redirect("/login");
  }

  const currency = userSettings?.currency || "USD";

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Profile</h2>
          <p className="page-description">
            Manage your profile and accounts.
          </p>
        </div>
      </div>

      <EnfixProfileClient data={profileData} currency={currency} />
    </div>
  );
}
