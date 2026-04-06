"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canEditAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "@/features/media/services/media.service";
import { addTagToMedia, removeTagFromMedia } from "../services/tag.service";
import { revalidatePath } from "next/cache";

export async function addTagAction(mediaId: string, tagName: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  const tagResult = await addTagToMedia(mediaId, tagName);
  if (!tagResult) return { error: "Invalid tag name" };

  revalidatePath(`/media/${mediaId}`);
  return { success: true, tag: tagResult };
}

export async function removeTagAction(mediaId: string, tagId: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await removeTagFromMedia(mediaId, tagId);
  revalidatePath(`/media/${mediaId}`);
  return { success: true };
}
