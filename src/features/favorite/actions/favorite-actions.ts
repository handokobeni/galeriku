"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "@/features/media/services/media.service";
import { toggleFavorite } from "../services/favorite.service";
import { revalidatePath } from "next/cache";

export async function toggleFavoriteAction(mediaId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = session.user.role;
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  const isFav = await toggleFavorite(mediaId, session.user.id);
  revalidatePath(`/media/${mediaId}`);
  revalidatePath("/favorites");
  return { success: true, isFavorited: isFav };
}
