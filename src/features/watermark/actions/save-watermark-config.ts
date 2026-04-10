"use server";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionWithRole } from "@/features/auth/lib/session";
import type { WatermarkConfig } from "../lib/config";

export async function saveWatermarkConfigAction(config: Partial<WatermarkConfig>) {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") {
    return { ok: false, error: "Unauthorized" };
  }

  // Read existing config first to merge
  const [existing] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "watermark_config"))
    .limit(1);

  const merged = { ...(existing?.value as Partial<WatermarkConfig> ?? {}), ...config };

  if (existing) {
    await db
      .update(appSettings)
      .set({ value: merged })
      .where(eq(appSettings.key, "watermark_config"));
  } else {
    await db.insert(appSettings).values({ key: "watermark_config", value: merged });
  }

  return { ok: true };
}
