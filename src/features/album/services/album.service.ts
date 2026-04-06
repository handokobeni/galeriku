import { db } from "@/db";
import { album, albumMember } from "@/db/schema";
import { media } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { AlbumMemberRole } from "../types";

export async function createAlbum(data: {
  name: string;
  description?: string;
  createdBy: string;
}) {
  const [newAlbum] = await db
    .insert(album)
    .values({
      name: data.name,
      description: data.description ?? null,
      createdBy: data.createdBy,
    })
    .returning();

  await db.insert(albumMember).values({
    albumId: newAlbum.id,
    userId: data.createdBy,
    role: "editor",
  });

  return newAlbum;
}

export async function getAlbumsForUser(userId: string, userRole: string) {
  if (userRole === "owner") {
    return db
      .select({
        id: album.id,
        name: album.name,
        description: album.description,
        coverMediaId: album.coverMediaId,
        createdBy: album.createdBy,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.album_id = ${album.id})::int`,
        memberCount: sql<number>`(SELECT COUNT(*) FROM album_member WHERE album_member.album_id = ${album.id})::int`,
      })
      .from(album)
      .orderBy(album.updatedAt);
  }

  return db
    .select({
      id: album.id,
      name: album.name,
      description: album.description,
      coverMediaId: album.coverMediaId,
      createdBy: album.createdBy,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.album_id = ${album.id})::int`,
      memberCount: sql<number>`(SELECT COUNT(*) FROM album_member WHERE album_member.album_id = ${album.id})::int`,
    })
    .from(album)
    .innerJoin(albumMember, eq(album.id, albumMember.albumId))
    .where(eq(albumMember.userId, userId))
    .orderBy(album.updatedAt);
}

export async function getAlbumById(albumId: string) {
  const [result] = await db
    .select()
    .from(album)
    .where(eq(album.id, albumId))
    .limit(1);
  return result ?? null;
}

export async function updateAlbum(
  albumId: string,
  data: { name?: string; description?: string; coverMediaId?: string | null }
) {
  const [updated] = await db
    .update(album)
    .set(data)
    .where(eq(album.id, albumId))
    .returning();
  return updated;
}

export async function deleteAlbum(albumId: string) {
  await db.delete(album).where(eq(album.id, albumId));
}

export async function canAccessAlbum(
  albumId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === "owner") return true;

  const [member] = await db
    .select()
    .from(albumMember)
    .where(and(eq(albumMember.albumId, albumId), eq(albumMember.userId, userId)))
    .limit(1);

  return !!member;
}

export async function canEditAlbum(
  albumId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === "owner") return true;

  const [member] = await db
    .select()
    .from(albumMember)
    .where(
      and(
        eq(albumMember.albumId, albumId),
        eq(albumMember.userId, userId),
        eq(albumMember.role, "editor")
      )
    )
    .limit(1);

  return !!member;
}

export async function getAlbumMembers(albumId: string) {
  return db
    .select({
      userId: albumMember.userId,
      userName: user.name,
      userEmail: user.email,
      role: albumMember.role,
      invitedAt: albumMember.invitedAt,
    })
    .from(albumMember)
    .innerJoin(user, eq(albumMember.userId, user.id))
    .where(eq(albumMember.albumId, albumId));
}

export async function addAlbumMember(
  albumId: string,
  userId: string,
  role: AlbumMemberRole = "viewer"
) {
  await db
    .insert(albumMember)
    .values({ albumId, userId, role })
    .onConflictDoNothing();
}

export async function removeAlbumMember(albumId: string, userId: string) {
  await db
    .delete(albumMember)
    .where(and(eq(albumMember.albumId, albumId), eq(albumMember.userId, userId)));
}

export async function updateMemberRole(
  albumId: string,
  userId: string,
  role: AlbumMemberRole
) {
  await db
    .update(albumMember)
    .set({ role })
    .where(and(eq(albumMember.albumId, albumId), eq(albumMember.userId, userId)));
}
