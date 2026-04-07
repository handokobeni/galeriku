"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateAlbum, canManageAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

const updateAlbumSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function updateAlbumAction(
  albumId: string,
  data: { name?: string; description?: string }
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  const parsed = updateAlbumSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await updateAlbum(albumId, parsed.data);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
