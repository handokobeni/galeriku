import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AppSettingsValues {
  app_name: string;
  registration_open: boolean;
  max_upload_photo_mb: number;
  max_upload_video_mb: number;
  storage_warning_pct: number;
}

export async function getAllSettings(): Promise<AppSettingsValues> {
  const rows = await db.select().from(appSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    app_name: (map.app_name as string) ?? "Galeriku",
    registration_open: (map.registration_open as boolean) ?? false,
    max_upload_photo_mb: (map.max_upload_photo_mb as number) ?? 20,
    max_upload_video_mb: (map.max_upload_video_mb as number) ?? 500,
    storage_warning_pct: (map.storage_warning_pct as number) ?? 80,
  };
}

export async function updateSetting(key: string, value: unknown) {
  await db
    .update(appSettings)
    .set({ value: value as never, updatedAt: new Date() })
    .where(eq(appSettings.key, key));
}
