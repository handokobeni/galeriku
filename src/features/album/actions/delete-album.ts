"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { deleteAlbum, canManageAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

export async function deleteAlbumAction(albumId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canManage = await canManageAlbum(albumId, session.user.id, userRole);
  if (!canManage) return { error: "Permission denied" };

  await deleteAlbum(albumId);
  revalidatePath("/albums");
  return { success: true };
}
