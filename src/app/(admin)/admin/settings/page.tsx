import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllSettings } from "@/features/admin/services/settings.service";
import { SettingsForm } from "@/features/admin/components/settings-form";

export default async function AdminSettingsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const settings = await getAllSettings();

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12">
        <p className="label-eyebrow mb-4">✦ 06 — Settings</p>
        <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground">
          Studio <em className="italic font-light text-primary">settings</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground italic">
          Application configuration and preferences
        </p>
        <div className="divider-gold mt-8" />
      </header>

      <SettingsForm initial={settings} />
    </div>
  );
}
