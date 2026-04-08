import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { like, inArray } from "drizzle-orm";
import {
  getAlbumBySlug,
  getAlbumWithCountBySlug,
  getAlbumCoverMediaId,
} from "./get-album-by-slug";

describe("getAlbumBySlug", () => {
  let userId: string;
  beforeEach(async () => {
    const scopedAlbums = await db
      .select({ id: album.id })
      .from(album)
      .where(like(album.slug, "abc12-%"));
    if (scopedAlbums.length) {
      await db
        .delete(media)
        .where(
          inArray(
            media.albumId,
            scopedAlbums.map((x) => x.id),
          ),
        );
    }
    await db.delete(album).where(like(album.slug, "abc12-%"));
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "S",
        email: `gabs-${uniq}@x.io`,
        emailVerified: true,
        username: `gabs-${uniq}`,
        role: "owner",
      })
      .returning();
    userId = u.id;
  });

  it("returns null when slug not found", async () => {
    expect(await getAlbumBySlug("nope-x")).toBeNull();
  });

  it("returns the album row only (no media join)", async () => {
    const [a] = await db
      .insert(album)
      .values({
        name: "Wedding",
        slug: "abc12-w",
        isPublic: true,
        createdBy: userId,
        publishedAt: new Date(),
      })
      .returning();
    await db.insert(media).values({
      albumId: a.id,
      uploadedBy: userId,
      type: "photo",
      filename: "x.jpg",
      r2Key: "x",
      thumbnailR2Key: "xt",
      mimeType: "image/jpeg",
      sizeBytes: 1,
    });
    const result = await getAlbumBySlug("abc12-w");
    expect(result).not.toBeNull();
    expect(result!.album.name).toBe("Wedding");
    expect(result).not.toHaveProperty("media");
  });

  it("returns the album even when not public (caller decides gating)", async () => {
    await db.insert(album).values({
      name: "X",
      slug: "abc12-x",
      isPublic: false,
      createdBy: userId,
    });
    const result = await getAlbumBySlug("abc12-x");
    expect(result).not.toBeNull();
    expect(result!.album.isPublic).toBe(false);
  });
});

describe("getAlbumWithCountBySlug", () => {
  let userId: string;
  beforeEach(async () => {
    const scoped = await db
      .select({ id: album.id })
      .from(album)
      .where(like(album.slug, "abc12-cnt-%"));
    if (scoped.length) {
      await db
        .delete(media)
        .where(
          inArray(
            media.albumId,
            scoped.map((x) => x.id),
          ),
        );
      await db.delete(album).where(
        inArray(
          album.id,
          scoped.map((x) => x.id),
        ),
      );
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "S",
        email: `gabsc-${uniq}@x.io`,
        emailVerified: true,
        username: `gabsc-${uniq}`,
        role: "owner",
      })
      .returning();
    userId = u.id;
  });

  it("returns album + zero count when no media", async () => {
    await db.insert(album).values({
      name: "Empty",
      slug: "abc12-cnt-empty",
      isPublic: true,
      createdBy: userId,
    });
    const r = await getAlbumWithCountBySlug("abc12-cnt-empty");
    expect(r).not.toBeNull();
    expect(r!.mediaCount).toBe(0);
  });

  it("returns correct count for multi-photo album", async () => {
    const [a] = await db
      .insert(album)
      .values({
        name: "Many",
        slug: "abc12-cnt-many",
        isPublic: true,
        createdBy: userId,
      })
      .returning();
    for (let i = 0; i < 3; i++) {
      await db.insert(media).values({
        albumId: a.id,
        uploadedBy: userId,
        type: "photo",
        filename: `f${i}.jpg`,
        r2Key: `k${i}`,
        thumbnailR2Key: `kt${i}`,
        mimeType: "image/jpeg",
        sizeBytes: 1,
      });
    }
    const r = await getAlbumWithCountBySlug("abc12-cnt-many");
    expect(r!.mediaCount).toBe(3);
  });
});

describe("getAlbumCoverMediaId", () => {
  let userId: string;
  beforeEach(async () => {
    const scoped = await db
      .select({ id: album.id })
      .from(album)
      .where(like(album.slug, "abc12-cov-%"));
    if (scoped.length) {
      await db
        .delete(media)
        .where(
          inArray(
            media.albumId,
            scoped.map((x) => x.id),
          ),
        );
      await db.delete(album).where(
        inArray(
          album.id,
          scoped.map((x) => x.id),
        ),
      );
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "S",
        email: `gcov-${uniq}@x.io`,
        emailVerified: true,
        username: `gcov-${uniq}`,
        role: "owner",
      })
      .returning();
    userId = u.id;
  });

  it("returns explicit coverMediaId when set", async () => {
    const explicit = crypto.randomUUID();
    const [a] = await db
      .insert(album)
      .values({
        name: "X",
        slug: "abc12-cov-explicit",
        isPublic: true,
        createdBy: userId,
      })
      .returning();
    const r = await getAlbumCoverMediaId(a.id, explicit);
    expect(r).toBe(explicit);
  });

  it("falls back to first uploaded media when no explicit cover", async () => {
    const [a] = await db
      .insert(album)
      .values({
        name: "X",
        slug: "abc12-cov-fallback",
        isPublic: true,
        createdBy: userId,
      })
      .returning();
    const [m] = await db
      .insert(media)
      .values({
        albumId: a.id,
        uploadedBy: userId,
        type: "photo",
        filename: "first.jpg",
        r2Key: "first",
        thumbnailR2Key: "ft",
        mimeType: "image/jpeg",
        sizeBytes: 1,
      })
      .returning();
    const r = await getAlbumCoverMediaId(a.id, null);
    expect(r).toBe(m.id);
  });

  it("returns null when album has no media and no cover", async () => {
    const [a] = await db
      .insert(album)
      .values({
        name: "X",
        slug: "abc12-cov-none",
        isPublic: true,
        createdBy: userId,
      })
      .returning();
    const r = await getAlbumCoverMediaId(a.id, null);
    expect(r).toBeNull();
  });
});
