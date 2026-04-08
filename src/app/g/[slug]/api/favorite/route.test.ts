import { describe, expect, it, beforeEach, vi } from "vitest";
import { db } from "@/db";
import { user, album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { like, inArray, eq, and } from "drizzle-orm";
import { signCookie } from "@/features/guest-gallery/lib/cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = cookieStore.get(name);
      return v ? { value: v, name } : undefined;
    },
  }),
}));

import { POST, DELETE } from "./route";

describe("/g/[slug]/api/favorite", () => {
  let albumId: string;
  let mediaId: string;
  let guestId: string;
  let slug: string;

  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    cookieStore.clear();
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "frt12-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      await db.delete(galleryFavorites).where(
        inArray(
          galleryFavorites.mediaId,
          (await db.select({ id: media.id }).from(media).where(inArray(media.albumId, ids))).map((m) => m.id),
        ),
      );
      await db.delete(galleryGuests).where(inArray(galleryGuests.albumId, ids));
      await db.delete(media).where(inArray(media.albumId, ids));
      await db.delete(album).where(inArray(album.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `frt-${uniq}@x.io`,
      emailVerified: true, username: `frt-${uniq}`, role: "owner",
    }).returning();
    slug = `frt12-x-${uniq.slice(0, 8)}`;
    const [a] = await db.insert(album).values({
      name: "X", slug, isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
    const [m] = await db.insert(media).values({
      albumId, uploadedBy: u.id, type: "photo", filename: "a.jpg",
      r2Key: `frt12/${uniq}/a.jpg`, thumbnailR2Key: `frt12/${uniq}/a_thumb.jpg`,
      mimeType: "image/jpeg", sizeBytes: 100,
    }).returning();
    mediaId = m.id;
    const [g] = await db.insert(galleryGuests).values({
      albumId, displayName: "Sinta",
    }).returning();
    guestId = g.id;
  });

  it("returns 401 without guest cookie", async () => {
    const req = new Request(`http://localhost/g/${slug}/api/favorite`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(401);
  });

  it("adds favorite with valid guest cookie", async () => {
    const token = await signCookie({ guestId, albumId, exp: Date.now() + 60_000 }, SECRET);
    cookieStore.set("gk_guest", token);
    const req = new Request(`http://localhost/g/${slug}/api/favorite`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `9.9.9.${Date.now() % 255}`,
      },
      body: JSON.stringify({ mediaId }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(200);
    const favs = await db.select().from(galleryFavorites).where(
      and(eq(galleryFavorites.guestId, guestId), eq(galleryFavorites.mediaId, mediaId)),
    );
    expect(favs).toHaveLength(1);
  });

  it("removes favorite via DELETE", async () => {
    await db.insert(galleryFavorites).values({ guestId, mediaId });
    const token = await signCookie({ guestId, albumId, exp: Date.now() + 60_000 }, SECRET);
    cookieStore.set("gk_guest", token);
    const req = new Request(`http://localhost/g/${slug}/api/favorite`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `8.8.8.${Date.now() % 255}`,
      },
      body: JSON.stringify({ mediaId }),
    });
    const res = await DELETE(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(200);
    const favs = await db.select().from(galleryFavorites).where(
      and(eq(galleryFavorites.guestId, guestId), eq(galleryFavorites.mediaId, mediaId)),
    );
    expect(favs).toHaveLength(0);
  });
});
