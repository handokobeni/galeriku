import { db } from "@/db";
import { album, media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { generateSlug } from "@/features/guest-gallery/lib/slug";
import { generateWatermarks } from "@/features/watermark/server/generate-watermarks";
import { getObject } from "@/shared/lib/r2";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;

async function fetchR2(key: string): Promise<Buffer> {
  const response = await getObject(key);
  const body = await response.Body?.transformToByteArray();
  if (!body) throw new Error(`Failed to fetch ${key} from R2`);
  return Buffer.from(body);
}

async function uploadR2(key: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
}

async function updateVariants(mediaId: string, variants: Record<string, string>) {
  const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (!m) return;
  const merged = { ...(m.variants ?? {}), ...variants };
  await db.update(media).set({ variants: merged }).where(eq(media.id, mediaId));
}

export type PublishResult =
  | { ok: true; slug: string; jobId?: string }
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

  let slug: string;

  // Already published — keep existing slug, just update the rest.
  if (a.slug) {
    await db.update(album).set(baseUpdate).where(eq(album.id, input.albumId));
    slug = a.slug;
  } else {
    // First publish — generate a unique slug. Catch unique-violation in the
    // UPDATE itself (covers TOCTOU between SELECT and UPDATE) and retry.
    let found = false;
    slug = "";
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = generateSlug(a.name);
      try {
        await db
          .update(album)
          .set({ ...baseUpdate, slug: candidate })
          .where(eq(album.id, input.albumId));
        slug = candidate;
        found = true;
        break;
      } catch (err) {
        // Postgres unique violation
        const code = (err as { code?: string } | null)?.code;
        if (code === "23505") continue;
        throw err;
      }
    }
    if (!found) return { ok: false, reason: "slug-collision" };
  }

  // Trigger watermark generation for "watermarked" policy
  if (input.downloadPolicy === "watermarked") {
    const mediaItems = await db
      .select({ id: media.id, r2Key: media.r2Key })
      .from(media)
      .where(eq(media.albumId, input.albumId));

    // Fire and forget -- client polls via /api/watermark/status/[jobId]
    generateWatermarks({
      db,
      albumId: input.albumId,
      mediaItems,
      fetchR2,
      uploadR2,
      updateVariants,
    }).catch((err) => {
      console.error("[publishAlbum] watermark generation failed:", err);
    });

    return { ok: true, slug, jobId: input.albumId };
  }

  return { ok: true, slug };
}
