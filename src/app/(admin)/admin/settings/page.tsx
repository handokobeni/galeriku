import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllSettings } from "@/features/admin/services/settings.service";
import { SettingsForm } from "@/features/admin/components/settings-form";

export default async function AdminSettingsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const settings = await getAllSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Application configuration</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
