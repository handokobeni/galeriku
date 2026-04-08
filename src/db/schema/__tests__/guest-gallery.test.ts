import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { eq, like, inArray } from "drizzle-orm";
import { user } from "@/db/schema";

describe("guest-gallery schema", () => {
  let userId: string;
  let albumId: string;
  let mediaId: string;

  beforeEach(async () => {
    // Scoped cleanup: only this test's data (slug prefix sch12-)
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "sch12-%"));
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
      id: crypto.randomUUID(),
      name: "Studio",
      email: `sch-${uniq}@x.io`,
      emailVerified: true,
      username: `sch-${uniq}`,
      role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "Wedding",
      slug: "sch12-wedding",
      createdBy: userId,
    }).returning();
    albumId = a.id;
    const [m] = await db.insert(media).values({
      albumId,
      uploadedBy: userId,
      type: "photo",
      filename: "x.jpg",
      r2Key: "x",
      thumbnailR2Key: "xt",
      mimeType: "image/jpeg",
      sizeBytes: 1,
    }).returning();
    mediaId = m.id;
  });

  it("album has new gallery columns with defaults", async () => {
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.slug).toBe("sch12-wedding");
    expect(a.isPublic).toBe(false);
    expect(a.passwordHash).toBeNull();
    expect(a.downloadPolicy).toBe("none");
    expect(a.publishedAt).toBeNull();
    expect(a.expiresAt).toBeNull();
  });

  it("media has variants and variantStatus", async () => {
    const [m] = await db.select().from(media).where(eq(media.id, mediaId));
    expect(m.variants).toEqual({});
    expect(m.variantStatus).toBe("pending");
  });

  it("inserts gallery guest and favorite", async () => {
    const [g] = await db.insert(galleryGuests).values({
      albumId,
      displayName: "Tante Sinta",
    }).returning();
    expect(g.displayName).toBe("Tante Sinta");
    await db.insert(galleryFavorites).values({ guestId: g.id, mediaId });
    const favs = await db.select().from(galleryFavorites).where(eq(galleryFavorites.guestId, g.id));
    expect(favs).toHaveLength(1);
  });

  it("rejects duplicate favorite for same guest+media", async () => {
    const [g] = await db.insert(galleryGuests).values({
      albumId,
      displayName: "X",
    }).returning();
    await db.insert(galleryFavorites).values({ guestId: g.id, mediaId });
    await expect(
      db.insert(galleryFavorites).values({ guestId: g.id, mediaId })
    ).rejects.toThrow();
  });

  it("cascades favorites when album deleted", async () => {
    const [g] = await db.insert(galleryGuests).values({
      albumId,
      displayName: "X",
    }).returning();
    await db.insert(galleryFavorites).values({ guestId: g.id, mediaId });
    await db.delete(album).where(eq(album.id, albumId));
    const guests = await db.select().from(galleryGuests).where(eq(galleryGuests.albumId, albumId));
    const favs = await db.select().from(galleryFavorites).where(eq(galleryFavorites.guestId, g.id));
    expect(guests).toHaveLength(0);
    expect(favs).toHaveLength(0);
  });
});
