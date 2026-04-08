import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq, lt, desc } from "drizzle-orm";

export type MediaPage = {
  items: (typeof media.$inferSelect)[];
  nextCursor: string | null;
  hasMore: boolean;
};

// Cursor format: ISO timestamp of the last item's createdAt.
// Order: createdAt DESC (newest first).
export async function getAlbumMediaPage(input: {
  albumId: string;
  limit: number;
  cursor?: string | null;
}): Promise<MediaPage> {
  const limit = Math.min(Math.max(input.limit, 1), 100);
  const where = input.cursor
    ? and(eq(media.albumId, input.albumId), lt(media.createdAt, new Date(input.cursor)))
    : eq(media.albumId, input.albumId);

  const items = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? sliced[sliced.length - 1].createdAt.toISOString() : null;
  return { items: sliced, nextCursor, hasMore };
}
