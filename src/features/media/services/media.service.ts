import { db } from "@/db";
import { media } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { deleteObject } from "@/shared/lib/r2";

export async function getMediaForAlbum(albumId: string, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  return db
    .select({
      id: media.id,
      albumId: media.albumId,
      uploadedBy: media.uploadedBy,
      type: media.type,
      filename: media.filename,
      r2Key: media.r2Key,
      thumbnailR2Key: media.thumbnailR2Key,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      width: media.width,
      height: media.height,
      duration: media.duration,
      createdAt: media.createdAt,
      uploaderName: user.name,
    })
    .from(media)
    .innerJoin(user, eq(media.uploadedBy, user.id))
    .where(eq(media.albumId, albumId))
    .orderBy(desc(media.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function getMediaById(mediaId: string) {
  const [result] = await db
    .select({
      id: media.id,
      albumId: media.albumId,
      uploadedBy: media.uploadedBy,
      type: media.type,
      filename: media.filename,
      r2Key: media.r2Key,
      thumbnailR2Key: media.thumbnailR2Key,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      width: media.width,
      height: media.height,
      duration: media.duration,
      createdAt: media.createdAt,
      uploaderName: user.name,
    })
    .from(media)
    .innerJoin(user, eq(media.uploadedBy, user.id))
    .where(eq(media.id, mediaId))
    .limit(1);
  return result ?? null;
}

export async function saveMediaBatch(
  items: Array<{
    id: string;
    albumId: string;
    uploadedBy: string;
    type: "photo" | "video";
    filename: string;
    r2Key: string;
    thumbnailR2Key: string;
    mimeType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
  }>
) {
  if (items.length === 0) return [];
  return db
    .insert(media)
    .values(
      items.map((item) => ({
        id: item.id,
        albumId: item.albumId,
        uploadedBy: item.uploadedBy,
        type: item.type,
        filename: item.filename,
        r2Key: item.r2Key,
        thumbnailR2Key: item.thumbnailR2Key,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        width: item.width ?? null,
        height: item.height ?? null,
        duration: item.duration ?? null,
      }))
    )
    .returning();
}

export async function deleteMediaById(mediaId: string) {
  const [mediaRecord] = await db
    .select()
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);
  if (!mediaRecord) return;

  await Promise.all([
    deleteObject(mediaRecord.r2Key),
    deleteObject(mediaRecord.thumbnailR2Key),
  ]);

  await db.delete(media).where(eq(media.id, mediaId));
}
