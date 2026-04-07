"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateSetting } from "../services/settings.service";
import { logActivity } from "@/features/activity/services/activity.service";
import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  app_name: z.string().min(1).max(100),
  registration_open: z.boolean(),
  max_upload_photo_mb: z.number().int().min(1).max(100),
  max_upload_video_mb: z.number().int().min(1).max(2000),
  storage_warning_pct: z.number().int().min(50).max(99),
});

export async function updateSettingsAction(
  data: z.infer<typeof settingsSchema>
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") return { error: "Permission denied" };

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await Promise.all([
    updateSetting("app_name", parsed.data.app_name),
    updateSetting("registration_open", parsed.data.registration_open),
    updateSetting("max_upload_photo_mb", parsed.data.max_upload_photo_mb),
    updateSetting("max_upload_video_mb", parsed.data.max_upload_video_mb),
    updateSetting("storage_warning_pct", parsed.data.storage_warning_pct),
  ]);

  await logActivity({
    userId: session.user.id,
    action: "settings_changed",
    entityType: "settings",
    entityId: null,
    metadata: { ...parsed.data },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
