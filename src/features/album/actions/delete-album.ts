"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { deleteAlbum, canEditAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

export async function deleteAlbumAction(albumId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await deleteAlbum(albumId);
  revalidatePath("/albums");
  return { success: true };
}
