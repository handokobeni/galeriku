"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "../services/media.service";
import { getViewPresignedUrl, getDownloadPresignedUrl } from "@/shared/lib/r2";

export async function getViewUrlAction(mediaId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = session.user.role;
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  const expiresIn = mediaRecord.type === "video" ? 14400 : 3600;
  const url = await getViewPresignedUrl(mediaRecord.r2Key, expiresIn);
  return { url };
}

export async function getDownloadUrlAction(mediaId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = session.user.role;
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  const url = await getDownloadPresignedUrl(mediaRecord.r2Key, mediaRecord.filename);
  return { url };
}
