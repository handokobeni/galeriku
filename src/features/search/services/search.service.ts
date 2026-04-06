import { db } from "@/db";
import { media, album, albumMember } from "@/db/schema";
import { tag, mediaTag } from "@/db/schema";
import { eq, ilike, and } from "drizzle-orm";
import type { SearchResult } from "../types";

export async function searchMedia(
  query: string,
  userId: string,
  userRole: string
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // Search albums by name
  let albumResults;
  if (userRole === "owner") {
    albumResults = await db
      .select({ id: album.id, name: album.name })
      .from(album)
      .where(ilike(album.name, searchTerm));
  } else {
    albumResults = await db
      .select({ id: album.id, name: album.name })
      .from(album)
      .innerJoin(albumMember, eq(album.id, albumMember.albumId))
      .where(and(eq(albumMember.userId, userId), ilike(album.name, searchTerm)));
  }

  for (const a of albumResults) {
    results.push({ type: "album", id: a.id, title: a.name });
  }

  // Search media by filename
  let mediaResults;
  if (userRole === "owner") {
    mediaResults = await db
      .select({
        id: media.id, filename: media.filename,
        albumId: media.albumId, albumName: album.name, type: media.type,
      })
      .from(media)
      .innerJoin(album, eq(media.albumId, album.id))
      .where(ilike(media.filename, searchTerm));
  } else {
    mediaResults = await db
      .select({
        id: media.id, filename: media.filename,
        albumId: media.albumId, albumName: album.name, type: media.type,
      })
      .from(media)
      .innerJoin(album, eq(media.albumId, album.id))
      .innerJoin(albumMember, eq(album.id, albumMember.albumId))
      .where(and(eq(albumMember.userId, userId), ilike(media.filename, searchTerm)));
  }

  for (const m of mediaResults) {
    results.push({
      type: "media", id: m.id, title: m.filename,
      albumId: m.albumId, albumName: m.albumName,
      mediaType: m.type, thumbnailMediaId: m.id,
    });
  }

  // Search by tag name
  let tagResults;
  if (userRole === "owner") {
    tagResults = await db
      .select({
        mediaId: media.id, filename: media.filename,
        albumId: media.albumId, albumName: album.name,
        type: media.type, tagName: tag.name,
      })
      .from(mediaTag)
      .innerJoin(tag, eq(mediaTag.tagId, tag.id))
      .innerJoin(media, eq(mediaTag.mediaId, media.id))
      .innerJoin(album, eq(media.albumId, album.id))
      .where(ilike(tag.name, searchTerm));
  } else {
    tagResults = await db
      .select({
        mediaId: media.id, filename: media.filename,
        albumId: media.albumId, albumName: album.name,
        type: media.type, tagName: tag.name,
      })
      .from(mediaTag)
      .innerJoin(tag, eq(mediaTag.tagId, tag.id))
      .innerJoin(media, eq(mediaTag.mediaId, media.id))
      .innerJoin(album, eq(media.albumId, album.id))
      .innerJoin(albumMember, eq(album.id, albumMember.albumId))
      .where(and(eq(albumMember.userId, userId), ilike(tag.name, searchTerm)));
  }

  for (const t of tagResults) {
    if (!results.some((r) => r.type === "media" && r.id === t.mediaId)) {
      results.push({
        type: "media", id: t.mediaId, title: `${t.filename} #${t.tagName}`,
        albumId: t.albumId, albumName: t.albumName,
        mediaType: t.type, thumbnailMediaId: t.mediaId,
      });
    }
  }

  return results;
}
