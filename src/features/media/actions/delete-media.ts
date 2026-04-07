"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { canEditAlbum } from "@/features/album/services/album.service";
import { getMediaById, deleteMediaById } from "../services/media.service";
import { revalidatePath } from "next/cache";

export async function deleteMediaAction(mediaId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = session.user.role;
  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await deleteMediaById(mediaId);
  revalidatePath(`/albums/${mediaRecord.albumId}`);
  return { success: true };
}
