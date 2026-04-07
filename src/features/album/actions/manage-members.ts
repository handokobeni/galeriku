"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import {
  addAlbumMember,
  removeAlbumMember,
  updateMemberRole,
  canEditAlbum,
} from "../services/album.service";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AlbumMemberRole } from "../types";

export async function inviteMemberAction(
  albumId: string,
  email: string,
  role: AlbumMemberRole = "viewer"
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!targetUser) return { error: "User not found" };

  await addAlbumMember(albumId, targetUser.id, role);
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
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await addAlbumMember(albumId, userId, role);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function removeMemberAction(albumId: string, userId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await removeAlbumMember(albumId, userId);
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

  const userRole = session.user.role;
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await updateMemberRole(albumId, userId, role);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
