"use server";
import { publishAlbum } from "../server/publish-album";
import { getSessionWithRole } from "@/features/auth/lib/session";

export async function publishAlbumAction(input: {
  albumId: string;
  password: string;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: string | null;
}) {
  try {
    const session = await getSessionWithRole();
    if (!session) {
      return { ok: false as const, reason: "Not signed in" };
    }
    const r = await publishAlbum({
      albumId: input.albumId,
      actorId: session.user.id,
      password: input.password,
      downloadPolicy: input.downloadPolicy,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });
    if (r.ok) return { ok: true as const, slug: r.slug };
    if (r.reason === "forbidden") {
      return { ok: false as const, reason: "Only the album creator can publish this album" };
    }
    if (r.reason === "not-found") {
      return { ok: false as const, reason: "Album not found" };
    }
    return { ok: false as const, reason: "Failed to publish" };
  } catch (err) {
    console.error("[publishAlbumAction] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, reason: `Server error: ${message}` };
  }
}
