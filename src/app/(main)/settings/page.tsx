import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
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

export default async function StudioSettingsPage() {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const watermarkData = await getWatermarkData();

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12 lg:mb-16">
        <p className="label-eyebrow mb-4">✦ Studio</p>
        <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] text-foreground">
          Your <em className="italic font-light text-primary">settings</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground italic">
          Watermark configuration for your published albums
        </p>
        <div className="divider-gold mt-8" />
      </header>

      <WatermarkSettingsSection
        initialConfig={watermarkData.config}
        logoPreviewUrl={watermarkData.logoPreviewUrl}
      />
    </div>
  );
}
