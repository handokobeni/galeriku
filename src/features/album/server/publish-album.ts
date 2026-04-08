import { db } from "@/db";
import { album } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { generateSlug } from "@/features/guest-gallery/lib/slug";

export type PublishResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "not-found" | "forbidden" | "slug-collision" };

const MAX_SLUG_ATTEMPTS = 10;

export async function publishAlbum(input: {
  albumId: string;
  actorId: string;
  password: string;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: Date | null;
}): Promise<PublishResult> {
  const [a] = await db.select().from(album).where(eq(album.id, input.albumId)).limit(1);
  if (!a) return { ok: false, reason: "not-found" };
  if (a.createdBy !== input.actorId) return { ok: false, reason: "forbidden" };

  const passwordHash = input.password ? await hash(input.password) : null;
  const baseUpdate = {
    isPublic: true,
    passwordHash,
    downloadPolicy: input.downloadPolicy,
    publishedAt: new Date(),
    expiresAt: input.expiresAt,
  };

  // Already published — keep existing slug, just update the rest.
  if (a.slug) {
    await db.update(album).set(baseUpdate).where(eq(album.id, input.albumId));
    return { ok: true, slug: a.slug };
  }

  // First publish — generate a unique slug. Catch unique-violation in the
  // UPDATE itself (covers TOCTOU between SELECT and UPDATE) and retry.
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = generateSlug(a.name);
    try {
      await db
        .update(album)
        .set({ ...baseUpdate, slug: candidate })
        .where(eq(album.id, input.albumId));
      return { ok: true, slug: candidate };
    } catch (err) {
      // Postgres unique violation
      const code = (err as { code?: string } | null)?.code;
      if (code === "23505") continue;
      throw err;
    }
  }

  return { ok: false, reason: "slug-collision" };
}
