import { db } from "@/db";
import { galleryFavorites, media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { favoriteLimiter } from "@/shared/lib/rate-limit";

export type ToggleResult = { ok: true } | { ok: false; reason: "not-found" | "rate-limited" };

export async function toggleFavorite(input: {
  guestId: string;
  mediaId: string;
  albumId: string;
  action: "add" | "remove";
  clientKey: string;
}): Promise<ToggleResult> {
  // Scope rate limit per album so a busy wedding venue (many guests behind
  // one NAT) doesn't have one bucket starving the rest. Caller already
  // includes guestId in clientKey for further isolation.
  if (!favoriteLimiter.check(`fav:${input.clientKey}:${input.albumId}`)) {
    return { ok: false, reason: "rate-limited" };
  }

  const [m] = await db
    .select({ id: media.id })
    .from(media)
    .where(and(eq(media.id, input.mediaId), eq(media.albumId, input.albumId)))
    .limit(1);
  if (!m) return { ok: false, reason: "not-found" };

  if (input.action === "add") {
    await db
      .insert(galleryFavorites)
      .values({ guestId: input.guestId, mediaId: input.mediaId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(galleryFavorites)
      .where(and(eq(galleryFavorites.guestId, input.guestId), eq(galleryFavorites.mediaId, input.mediaId)));
  }
  return { ok: true };
}
