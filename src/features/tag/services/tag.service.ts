import { db } from "@/db";
import { tag, mediaTag } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export async function getTagsForMedia(mediaId: string) {
  return db
    .select({ id: tag.id, name: tag.name })
    .from(mediaTag)
    .innerJoin(tag, eq(mediaTag.tagId, tag.id))
    .where(eq(mediaTag.mediaId, mediaId));
}

export async function findOrCreateTag(name: string) {
  const normalized = name.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
  if (!normalized) return null;

  const [existing] = await db.select().from(tag).where(eq(tag.name, normalized)).limit(1);
  if (existing) return existing;

  const [newTag] = await db.insert(tag).values({ name: normalized }).returning();
  return newTag;
}

export async function addTagToMedia(mediaId: string, tagName: string) {
  const tagRecord = await findOrCreateTag(tagName);
  if (!tagRecord) return null;

  await db.insert(mediaTag).values({ mediaId, tagId: tagRecord.id }).onConflictDoNothing();
  return tagRecord;
}

export async function removeTagFromMedia(mediaId: string, tagId: number) {
  await db.delete(mediaTag).where(and(eq(mediaTag.mediaId, mediaId), eq(mediaTag.tagId, tagId)));
}

export async function searchTags(query: string) {
  return db.select({ id: tag.id, name: tag.name }).from(tag).where(ilike(tag.name, `%${query}%`));
}
