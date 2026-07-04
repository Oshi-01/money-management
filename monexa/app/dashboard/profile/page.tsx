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
          <h2 className="text-2xl font-bold tracking-tight text-[#1e293b]">Profile</h2>
          <p className="text-sm text-gray-400">
            Welcome Enfix Finance Management
          </p>
        </div>
        <div className="text-sm text-gray-400 font-medium flex items-center">
          Home <span className="mx-2">&gt;</span> <span className="text-emerald-600">Profile</span>
        </div>
      </div>

      <EnfixProfileClient data={profileData} currency={currency} />
    </div>
  );
}
