import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";

describe("guest-gallery schema", () => {
  let userId: string;
  let albumId: string;
  let mediaId: string;

  beforeEach(async () => {
    await db.delete(galleryFavorites);
    await db.delete(galleryGuests);
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(),
      name: "Studio",
      email: `s${Date.now()}@x.io`,
      emailVerified: true,
      username: `studio${Date.now()}`,
      role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "Wedding",
      slug: "abc12-wedding",
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
    expect(a.slug).toBe("abc12-wedding");
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
    const favs = await db.select().from(galleryFavorites);
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
    const guests = await db.select().from(galleryGuests);
    const favs = await db.select().from(galleryFavorites);
    expect(guests).toHaveLength(0);
    expect(favs).toHaveLength(0);
  });
});
