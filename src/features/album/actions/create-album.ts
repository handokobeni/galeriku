"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/features/activity/services/activity.service";

const createAlbumSchema = z.object({
  name: z.string().min(1, "Album name is required").max(100),
  description: z.string().max(500).optional(),
});

export type CreateAlbumState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createAlbumAction(
  _prev: CreateAlbumState,
  formData: FormData
): Promise<CreateAlbumState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = createAlbumSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const newAlbum = await createAlbum({
      name: parsed.data.name,
      description: parsed.data.description,
      createdBy: session.user.id,
    });

    await logActivity({
      userId: session.user.id,
      action: "album_created",
      entityType: "album",
      entityId: newAlbum.id,
      metadata: { name: parsed.data.name },
    });
  } catch (err) {
    console.error("[create-album] Failed:", err);
    return { error: "Failed to create album" };
  }

  revalidatePath("/albums");
  return {};
}
