"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { deleteAlbum, canManageAlbum, getAlbumById } from "../services/album.service";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/features/activity/services/activity.service";

export async function deleteAlbumAction(albumId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  const albumRecord = await getAlbumById(albumId);
  await deleteAlbum(albumId);
  await logActivity({
    userId: session.user.id,
    action: "album_deleted",
    entityType: "album",
    entityId: albumId,
    metadata: { name: albumRecord?.name ?? null },
  });
  revalidatePath("/albums");
  return { success: true };
}
