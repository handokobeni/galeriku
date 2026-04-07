"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import {
  addAlbumMember,
  removeAlbumMember,
  updateMemberRole,
  canManageAlbum,
  getAlbumById,
} from "../services/album.service";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AlbumMemberRole } from "../types";
import { logActivity } from "@/features/activity/services/activity.service";

export async function inviteMemberAction(
  albumId: string,
  email: string,
  role: AlbumMemberRole = "viewer"
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!targetUser) return { error: "User not found" };

  await addAlbumMember(albumId, targetUser.id, role);
  await logActivity({
    userId: session.user.id,
    action: "member_added",
    entityType: "album",
    entityId: albumId,
    metadata: { addedUserId: targetUser.id },
  });
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function inviteMemberByIdAction(
  albumId: string,
  userId: string,
  role: AlbumMemberRole = "viewer"
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  await addAlbumMember(albumId, userId, role);
  await logActivity({
    userId: session.user.id,
    action: "member_added",
    entityType: "album",
    entityId: albumId,
    metadata: { addedUserId: userId, role },
  });
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function removeMemberAction(albumId: string, userId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  if (userId === session.user.id) {
    return { error: "Cannot remove yourself from the album" };
  }

  // Cannot remove the album creator
  const albumRecord = await getAlbumById(albumId);
  if (albumRecord?.createdBy === userId) {
    return { error: "Cannot remove the album owner" };
  }

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  await removeAlbumMember(albumId, userId);
  await logActivity({
    userId: session.user.id,
    action: "member_removed",
    entityType: "album",
    entityId: albumId,
    metadata: { removedUserId: userId },
  });
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function updateMemberRoleAction(
  albumId: string,
  userId: string,
  role: AlbumMemberRole
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  if (userId === session.user.id) {
    return { error: "Cannot change your own role" };
  }

  // Cannot change the album creator's role
  const albumRecord = await getAlbumById(albumId);
  if (albumRecord?.createdBy === userId) {
    return { error: "Cannot change the album owner's role" };
  }

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  await updateMemberRole(albumId, userId, role);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
