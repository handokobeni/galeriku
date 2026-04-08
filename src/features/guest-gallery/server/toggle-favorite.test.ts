import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { eq, like, inArray } from "drizzle-orm";
import { toggleFavorite } from "./toggle-favorite";

describe("toggleFavorite", () => {
  let userId: string, albumId: string, mediaId: string, guestId: string, otherAlbumId: string, otherMediaId: string;

  beforeEach(async () => {
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "fav12-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      const guestRows = await db.select({ id: galleryGuests.id }).from(galleryGuests).where(inArray(galleryGuests.albumId, ids));
      if (guestRows.length) {
        await db.delete(galleryFavorites).where(inArray(galleryFavorites.guestId, guestRows.map((g) => g.id)));
      }
      await db.delete(galleryGuests).where(inArray(galleryGuests.albumId, ids));
      await db.delete(media).where(inArray(media.albumId, ids));
      await db.delete(album).where(inArray(album.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `fav-${uniq}@x.io`,
      emailVerified: true, username: `fav-${uniq}`, role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "X", slug: `fav12-a-${uniq.slice(0,8)}`, isPublic: true, createdBy: userId,
    }).returning();
    albumId = a.id;
    const [m] = await db.insert(media).values({
      albumId, uploadedBy: userId, type: "photo", filename: "x", r2Key: "k",
      thumbnailR2Key: "kt", mimeType: "image/jpeg", sizeBytes: 1,
    }).returning();
    mediaId = m.id;
    const [g] = await db.insert(galleryGuests).values({ albumId, displayName: "S" }).returning();
    guestId = g.id;
    const [a2] = await db.insert(album).values({
      name: "Y", slug: `fav12-b-${uniq.slice(0,8)}`, isPublic: true, createdBy: userId,
    }).returning();
    otherAlbumId = a2.id;
    const [m2] = await db.insert(media).values({
      albumId: otherAlbumId, uploadedBy: userId, type: "photo", filename: "y", r2Key: "k2",
      thumbnailR2Key: "kt2", mimeType: "image/jpeg", sizeBytes: 1,
    }).returning();
    otherMediaId = m2.id;
  });

  it("adds favorite", async () => {
    const r = await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: `k-${Date.now()}` });
    expect(r.ok).toBe(true);
    const favs = await db.select().from(galleryFavorites).where(eq(galleryFavorites.guestId, guestId));
    expect(favs).toHaveLength(1);
  });

  it("idempotent add (no error on duplicate)", async () => {
    await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: `k1-${Date.now()}` });
    const r = await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: `k2-${Date.now()}` });
    expect(r.ok).toBe(true);
    const favs = await db.select().from(galleryFavorites).where(eq(galleryFavorites.guestId, guestId));
    expect(favs).toHaveLength(1);
  });

  it("removes favorite", async () => {
    await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: `k1-${Date.now()}` });
    const r = await toggleFavorite({ guestId, mediaId, albumId, action: "remove", clientKey: `k2-${Date.now()}` });
    expect(r.ok).toBe(true);
    const favs = await db.select().from(galleryFavorites).where(eq(galleryFavorites.guestId, guestId));
    expect(favs).toHaveLength(0);
  });

  it("rejects favorite for media in different album", async () => {
    const r = await toggleFavorite({ guestId, mediaId: otherMediaId, albumId, action: "add", clientKey: `k3-${Date.now()}` });
    expect(r.ok).toBe(false);
  });
});
