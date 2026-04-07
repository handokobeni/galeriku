"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { deleteAlbum, canEditAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

export async function deleteAlbumAction(albumId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await deleteAlbum(albumId);
  revalidatePath("/albums");
  return { success: true };
}
