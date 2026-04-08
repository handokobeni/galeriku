import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { like, inArray } from "drizzle-orm";
import { getAlbumMediaPage } from "./get-album-media-page";

describe("getAlbumMediaPage", () => {
  let albumId: string;

  beforeEach(async () => {
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "pgn12-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      await db.delete(media).where(inArray(media.albumId, ids));
      await db.delete(album).where(inArray(album.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `pgn-${uniq}@x.io`,
      emailVerified: true, username: `pgn-${uniq}`, role: "owner",
    }).returning();
    const [a] = await db.insert(album).values({
      name: "X", slug: `pgn12-${uniq.slice(0,8)}`, isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
    for (let i = 0; i < 25; i++) {
      await db.insert(media).values({
        albumId, uploadedBy: u.id, type: "photo",
        filename: `f${i}.jpg`, r2Key: `k${i}`, thumbnailR2Key: `kt${i}`,
        mimeType: "image/jpeg", sizeBytes: 1,
      });
      await new Promise((r) => setTimeout(r, 2));
    }
  });

  it("returns first page with hasMore=true", async () => {
    const r = await getAlbumMediaPage({ albumId, limit: 10 });
    expect(r.items).toHaveLength(10);
    expect(r.hasMore).toBe(true);
    expect(r.nextCursor).not.toBeNull();
  });

  it("returns next page using cursor (no overlap)", async () => {
    const first = await getAlbumMediaPage({ albumId, limit: 10 });
    const second = await getAlbumMediaPage({ albumId, limit: 10, cursor: first.nextCursor });
    expect(second.items).toHaveLength(10);
    const firstIds = new Set(first.items.map((m) => m.id));
    expect(second.items.every((m) => !firstIds.has(m.id))).toBe(true);
  });

  it("final page hasMore=false", async () => {
    const p1 = await getAlbumMediaPage({ albumId, limit: 10 });
    const p2 = await getAlbumMediaPage({ albumId, limit: 10, cursor: p1.nextCursor });
    const p3 = await getAlbumMediaPage({ albumId, limit: 10, cursor: p2.nextCursor });
    expect(p3.items).toHaveLength(5);
    expect(p3.hasMore).toBe(false);
    expect(p3.nextCursor).toBeNull();
  });
});
