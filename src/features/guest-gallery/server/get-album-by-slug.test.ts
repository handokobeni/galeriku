import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { like, inArray } from "drizzle-orm";
import { getAlbumBySlug } from "./get-album-by-slug";

describe("getAlbumBySlug", () => {
  let userId: string;
  beforeEach(async () => {
    const scopedAlbums = await db.select({ id: album.id }).from(album).where(like(album.slug, "abc12-%"));
    if (scopedAlbums.length) {
      await db.delete(media).where(inArray(media.albumId, scopedAlbums.map((x) => x.id)));
    }
    await db.delete(album).where(like(album.slug, "abc12-%"));
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "S", email: `gabs-${uniq}@x.io`,
      emailVerified: true, username: `gabs-${uniq}`, role: "owner",
    }).returning();
    userId = u.id;
  });

  it("returns null when slug not found", async () => {
    expect(await getAlbumBySlug("nope-x")).toBeNull();
  });

  it("returns album with media list when found", async () => {
    const [a] = await db.insert(album).values({
      name: "Wedding", slug: "abc12-w", isPublic: true, createdBy: userId,
      publishedAt: new Date(),
    }).returning();
    await db.insert(media).values({
      albumId: a.id, uploadedBy: userId, type: "photo",
      filename: "x.jpg", r2Key: "x", thumbnailR2Key: "xt",
      mimeType: "image/jpeg", sizeBytes: 1,
    });
    const result = await getAlbumBySlug("abc12-w");
    expect(result).not.toBeNull();
    expect(result!.album.name).toBe("Wedding");
    expect(result!.media).toHaveLength(1);
  });

  it("returns the album even when not public (caller decides gating)", async () => {
    await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: false, createdBy: userId,
    });
    const result = await getAlbumBySlug("abc12-x");
    expect(result).not.toBeNull();
    expect(result!.album.isPublic).toBe(false);
  });
});
