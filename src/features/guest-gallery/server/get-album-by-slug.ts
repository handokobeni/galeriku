import { db } from "@/db";
import { album, media } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AlbumWithMedia = {
  album: typeof album.$inferSelect;
  media: (typeof media.$inferSelect)[];
};

export async function getAlbumBySlug(slug: string): Promise<AlbumWithMedia | null> {
  const [a] = await db.select().from(album).where(eq(album.slug, slug)).limit(1);
  if (!a) return null;
  const m = await db.select().from(media).where(eq(media.albumId, a.id));
  return { album: a, media: m };
}
