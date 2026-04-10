import { eq } from "drizzle-orm";
import { album, appSettings } from "@/db/schema";
import { resolveWatermarkConfig, type WatermarkConfig } from "../lib/config";
import type { Database } from "@/db";

const SETTINGS_KEY = "watermark_config";

/**
 * Read global watermark config from app_settings + album-level override,
 * then resolve into a complete WatermarkConfig.
 */
export async function getWatermarkConfig(
  db: Database,
  albumId: string,
): Promise<WatermarkConfig> {
  // Fetch global config
  const [globalRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, SETTINGS_KEY))
    .limit(1);

  const globalConfig = (globalRow?.value as Partial<WatermarkConfig>) ?? null;

  // Fetch album override
  const [albumRow] = await db
    .select({ watermarkOverride: album.watermarkOverride })
    .from(album)
    .where(eq(album.id, albumId))
    .limit(1);

  const albumOverride = albumRow?.watermarkOverride ?? null;

  return resolveWatermarkConfig(globalConfig, albumOverride);
}
