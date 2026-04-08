import { describe, expect, it, beforeEach, vi } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { like, inArray, eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { signCookie } from "@/features/guest-gallery/lib/cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

const cookieStore = new Map<string, string>();
vi.mock("@/features/guest-gallery/server/batch-presign-urls", () => ({
  batchPresignUrls: async (items: Array<{ id: string }>) => {
    const out: Record<string, { thumbUrl: string; previewUrl: string }> = {};
    for (const m of items) out[m.id] = { thumbUrl: `https://x/${m.id}-t`, previewUrl: `https://x/${m.id}-p` };
    return out;
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = cookieStore.get(name);
      return v ? { value: v, name } : undefined;
    },
  }),
}));

import { GET } from "./route";

describe("GET /g/[slug]/api/media", () => {
  let albumId: string;
  let slug: string;

  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    cookieStore.clear();
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "mrt12-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      await db.delete(media).where(inArray(media.albumId, ids));
      await db.delete(album).where(inArray(album.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    slug = `mrt12-${uniq.slice(0,8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `mrt-${uniq}@x.io`,
      emailVerified: true, username: `mrt-${uniq}`, role: "owner",
    }).returning();
    const [a] = await db.insert(album).values({
      name: "X", slug, isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
    for (let i = 0; i < 5; i++) {
      await db.insert(media).values({
        albumId, uploadedBy: u.id, type: "photo",
        filename: `f${i}.jpg`, r2Key: `k${i}`, thumbnailR2Key: `kt${i}`,
        mimeType: "image/jpeg", sizeBytes: 1,
      });
    }
  });

  it("returns 401 for password-locked album without unlock cookie", async () => {
    const ph = await hash("x");
    await db.update(album).set({ passwordHash: ph }).where(eq(album.id, albumId));
    const req = new Request(`http://localhost/g/${slug}/api/media?limit=2`);
    const res = await GET(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(401);
  });

  it("returns first page with thumbUrl and previewUrl", async () => {
    const tok = await signCookie({ albumId, exp: Date.now() + 60_000 }, SECRET);
    cookieStore.set(`gk_unlock_${albumId}`, tok);
    const req = new Request(`http://localhost/g/${slug}/api/media?limit=2`);
    const res = await GET(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(2);
    expect(json.items[0]).toHaveProperty("thumbUrl");
    expect(json.items[0]).toHaveProperty("previewUrl");
    expect(json.hasMore).toBe(true);
  });
});
