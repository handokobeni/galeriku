"use server";
import { publishAlbum } from "../server/publish-album";
import { getSessionWithRole } from "@/features/auth/lib/session";

export async function publishAlbumAction(input: {
  albumId: string;
  password: string;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: string | null;
}) {
  const session = await getSessionWithRole();
  if (!session) return { ok: false } as const;
  const r = await publishAlbum({
    albumId: input.albumId,
    actorId: session.user.id,
    password: input.password,
    downloadPolicy: input.downloadPolicy,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });
  return r.ok ? { ok: true as const, slug: r.slug } : { ok: false as const };
}
