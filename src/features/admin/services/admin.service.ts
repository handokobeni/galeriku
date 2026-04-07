import { db } from "@/db";
import { user, album, media, albumMember } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import type { AdminStats, UserStat, AlbumStat } from "../types";

const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10GB R2 free tier

export async function getAdminStats(): Promise<AdminStats> {
  const [userCountRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(user);
  const [albumCountRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(album);
  const [mediaCountRow] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      photos: sql<number>`COUNT(CASE WHEN type = 'photo' THEN 1 END)::int`,
      videos: sql<number>`COUNT(CASE WHEN type = 'video' THEN 1 END)::int`,
      bytes: sql<number>`COALESCE(SUM(size_bytes), 0)::bigint`,
    })
    .from(media);

  return {
    totalUsers: userCountRow?.count ?? 0,
    totalAlbums: albumCountRow?.count ?? 0,
    totalMedia: mediaCountRow?.total ?? 0,
    totalPhotos: mediaCountRow?.photos ?? 0,
    totalVideos: mediaCountRow?.videos ?? 0,
    storageUsedBytes: Number(mediaCountRow?.bytes ?? 0),
    storageLimitBytes: STORAGE_LIMIT_BYTES,
  };
}

export async function getAllUsersForAdmin(): Promise<UserStat[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      albumCount: sql<number>`(SELECT COUNT(*) FROM album WHERE album.created_by = ${user.id})::int`,
      uploadCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.uploaded_by = ${user.id})::int`,
    })
    .from(user)
    .orderBy(user.createdAt);

  return rows.map((r) => ({ ...r, role: r.role ?? "member" })) as UserStat[];
}

export async function getAllAlbumsForAdmin(): Promise<AlbumStat[]> {
  const rows = await db
    .select({
      id: album.id,
      name: album.name,
      createdBy: album.createdBy,
      creatorName: user.name,
      createdAt: album.createdAt,
      mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.album_id = ${album.id})::int`,
      memberCount: sql<number>`(SELECT COUNT(*) FROM album_member WHERE album_member.album_id = ${album.id})::int`,
      storageBytes: sql<number>`(SELECT COALESCE(SUM(size_bytes), 0) FROM media WHERE media.album_id = ${album.id})::bigint`,
    })
    .from(album)
    .innerJoin(user, eq(album.createdBy, user.id))
    .orderBy(album.createdAt);

  return rows.map((r) => ({ ...r, storageBytes: Number(r.storageBytes) })) as AlbumStat[];
}

export async function getStorageByAlbum() {
  return getAllAlbumsForAdmin();
}
