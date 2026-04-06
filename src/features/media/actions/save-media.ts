"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canEditAlbum } from "@/features/album/services/album.service";
import { saveMediaBatch } from "../services/media.service";
import { revalidatePath } from "next/cache";

const mediaItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["photo", "video"]),
  filename: z.string(),
  r2Key: z.string(),
  thumbnailR2Key: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().positive(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
});

const saveMediaSchema = z.object({
  albumId: z.string().uuid(),
  items: z.array(mediaItemSchema).min(1),
});

export async function saveMediaAction(data: z.infer<typeof saveMediaSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = saveMediaSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const { albumId, items } = parsed.data;
  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";

  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  try {
    await saveMediaBatch(
      items.map((item) => ({ ...item, albumId, uploadedBy: session.user.id }))
    );
  } catch {
    return { error: "Failed to save media metadata" };
  }

  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
