import { db } from "@/db";
import { favorite } from "@/db/schema";
import { media } from "@/db/schema";
import { albumMember } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function isFavorited(mediaId: string, userId: string): Promise<boolean> {
  const [result] = await db
    .select()
    .from(favorite)
    .where(and(eq(favorite.mediaId, mediaId), eq(favorite.userId, userId)))
    .limit(1);
  return !!result;
}

export async function toggleFavorite(mediaId: string, userId: string): Promise<boolean> {
  const existing = await isFavorited(mediaId, userId);
  if (existing) {
    await db.delete(favorite).where(and(eq(favorite.mediaId, mediaId), eq(favorite.userId, userId)));
    return false;
  }
  await db.insert(favorite).values({ mediaId, userId }).onConflictDoNothing();
  return true;
}

export async function getFavoritesForUser(userId: string, userRole: string) {
  if (userRole === "owner") {
    return db
      .select({
        mediaId: favorite.mediaId, albumId: media.albumId, type: media.type,
        filename: media.filename, thumbnailR2Key: media.thumbnailR2Key,
        duration: media.duration, favoritedAt: favorite.createdAt,
      })
      .from(favorite)
      .innerJoin(media, eq(favorite.mediaId, media.id))
      .where(eq(favorite.userId, userId))
      .orderBy(desc(favorite.createdAt));
  }
  return db
    .select({
      mediaId: favorite.mediaId, albumId: media.albumId, type: media.type,
      filename: media.filename, thumbnailR2Key: media.thumbnailR2Key,
      duration: media.duration, favoritedAt: favorite.createdAt,
    })
    .from(favorite)
    .innerJoin(media, eq(favorite.mediaId, media.id))
    .innerJoin(albumMember, and(eq(media.albumId, albumMember.albumId), eq(albumMember.userId, userId)))
    .where(eq(favorite.userId, userId))
    .orderBy(desc(favorite.createdAt));
}

export async function getFavoriteCount(mediaId: string): Promise<number> {
  const result = await db.select({ mediaId: favorite.mediaId }).from(favorite).where(eq(favorite.mediaId, mediaId));
  return result.length;
}
