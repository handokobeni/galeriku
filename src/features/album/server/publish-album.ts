import { db } from "@/db";
import { album } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { generateSlug } from "@/features/guest-gallery/lib/slug";

export type PublishResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "not-found" | "forbidden" };

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

  let slug = a.slug ?? "";
  if (!slug) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateSlug(a.name);
      const [existing] = await db.select({ id: album.id }).from(album).where(eq(album.slug, candidate)).limit(1);
      if (!existing) {
        slug = candidate;
        break;
      }
    }
  }

  const passwordHash = input.password ? await hash(input.password) : null;
  await db
    .update(album)
    .set({
      slug,
      isPublic: true,
      passwordHash,
      downloadPolicy: input.downloadPolicy,
      publishedAt: new Date(),
      expiresAt: input.expiresAt,
    })
    .where(eq(album.id, input.albumId));

  return { ok: true, slug };
}
