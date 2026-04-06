import { NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { appSettings } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST() {
  // Get current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only allow if this is the first user (no other owners)
  const [ownerCount] = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, "owner"));

  if (ownerCount.count > 0) {
    return NextResponse.json({ error: "Owner already exists" }, { status: 403 });
  }

  // Set role to owner
  await db
    .update(user)
    .set({ role: "owner" })
    .where(eq(user.id, session.user.id));

  // Seed default app settings
  await db
    .insert(appSettings)
    .values([
      { key: "app_name", value: JSON.stringify("Galeriku") },
      { key: "registration_open", value: JSON.stringify(false) },
      { key: "max_upload_photo_mb", value: JSON.stringify(20) },
      { key: "max_upload_video_mb", value: JSON.stringify(500) },
      { key: "storage_warning_pct", value: JSON.stringify(80) },
    ])
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
