"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "@/features/media/services/media.service";
import { addComment, deleteComment } from "../services/comment.service";
import { revalidatePath } from "next/cache";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

export async function addCommentAction(mediaId: string, content: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return { error: "Invalid comment" };

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  await addComment(mediaId, session.user.id, parsed.data.content);
  revalidatePath(`/media/${mediaId}`);
  return { success: true };
}

export async function deleteCommentAction(commentId: string, mediaId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  await deleteComment(commentId);
  revalidatePath(`/media/${mediaId}`);
  return { success: true };
}
