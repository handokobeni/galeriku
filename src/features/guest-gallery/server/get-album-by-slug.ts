import { db } from "@/db";
import { album, media } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";

export type AlbumLookup = {
  album: typeof album.$inferSelect;
};

export type AlbumWithCount = AlbumLookup & {
  mediaCount: number;
};

/**
 * Lightweight: returns only the album row (no media join). Use this for
 * routes that only need the album metadata — unlock, guest, favorite,
 * download, manifest, media-page route.
 */
export async function getAlbumBySlug(slug: string): Promise<AlbumLookup | null> {
  const [a] = await db.select().from(album).where(eq(album.slug, slug)).limit(1);
  if (!a) return null;
  return { album: a };
}

/**
 * For pages that need to display a total photo count alongside the album.
 * Single COUNT query — does not load any media rows.
 */
export async function getAlbumWithCountBySlug(slug: string): Promise<AlbumWithCount | null> {
  const [a] = await db.select().from(album).where(eq(album.slug, slug)).limit(1);
  if (!a) return null;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(media)
    .where(eq(media.albumId, a.id));
  return { album: a, mediaCount: count };
}

/**
 * Resolve the cover image id for an album: prefer the explicit coverMediaId,
 * fall back to the first uploaded media. Used by /cover.jpg only.
 */
export async function getAlbumCoverMediaId(
  albumId: string,
  explicitCoverId: string | null,
): Promise<string | null> {
  if (explicitCoverId) return explicitCoverId;
  const [m] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.albumId, albumId))
    .orderBy(asc(media.createdAt))
    .limit(1);
  return m?.id ?? null;
}
