import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllSettings } from "@/features/admin/services/settings.service";
import { SettingsForm } from "@/features/admin/components/settings-form";
import { WatermarkSettingsSection } from "@/features/watermark/components/watermark-settings-section";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getViewPresignedUrl } from "@/shared/lib/r2";
import type { WatermarkConfig } from "@/features/watermark/lib/config";

async function getWatermarkData() {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "watermark_config"))
    .limit(1);
  const config = (row?.value as Partial<WatermarkConfig>) ?? null;
  let logoPreviewUrl: string | null = null;
  if (config?.logoR2Key) {
    try {
      logoPreviewUrl = await getViewPresignedUrl(config.logoR2Key, 3600);
    } catch {}
  }
  return { config, logoPreviewUrl };
}

export default async function AdminSettingsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const [settings, watermarkData] = await Promise.all([
    getAllSettings(),
    getWatermarkData(),
  ]);

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

      <div className="space-y-16">
        {/* App settings */}
        <section>
          <p className="label-eyebrow mb-6">✦ General</p>
          <SettingsForm initial={settings} />
        </section>

        {/* Watermark settings */}
        <section>
          <div className="divider-gold mb-10" />
          <WatermarkSettingsSection
            initialConfig={watermarkData.config}
            logoPreviewUrl={watermarkData.logoPreviewUrl}
          />
        </section>
      </div>
    </div>
  );
}
