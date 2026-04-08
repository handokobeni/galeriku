import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq, lt, or, desc } from "drizzle-orm";

export type MediaPage = {
  items: (typeof media.$inferSelect)[];
  nextCursor: string | null;
  hasMore: boolean;
};

// Composite cursor: "<ISO createdAt>|<id>" — bulk uploads often share the
// same createdAt timestamp, so a cursor on createdAt alone can skip or
// duplicate rows at page boundaries.
function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}|${id}`;
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  const idx = cursor.indexOf("|");
  if (idx < 0) return null;
  const ts = cursor.slice(0, idx);
  const id = cursor.slice(idx + 1);
  const date = new Date(ts);
  if (Number.isNaN(date.getTime()) || !id) return null;
  return { createdAt: date, id };
}

export async function getAlbumMediaPage(input: {
  albumId: string;
  limit: number;
  cursor?: string | null;
}): Promise<MediaPage> {
  const limit = Math.min(Math.max(input.limit, 1), 100);

  let where;
  if (input.cursor) {
    const decoded = decodeCursor(input.cursor);
    if (decoded) {
      // (createdAt, id) < (cursorCreatedAt, cursorId) under DESC ordering
      where = and(
        eq(media.albumId, input.albumId),
        or(
          lt(media.createdAt, decoded.createdAt),
          and(eq(media.createdAt, decoded.createdAt), lt(media.id, decoded.id)),
        ),
      );
    } else {
      where = eq(media.albumId, input.albumId);
    }
  } else {
    where = eq(media.albumId, input.albumId);
  }

  const items = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt), desc(media.id))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const last = sliced[sliced.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;
  return { items: sliced, nextCursor, hasMore };
}
