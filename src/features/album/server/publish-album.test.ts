import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { like, inArray, eq } from "drizzle-orm";
import { publishAlbum } from "./publish-album";

describe("publishAlbum", () => {
  let userId: string, otherUserId: string, albumId: string;

  beforeEach(async () => {
    const ours = await db.select({ id: user.id }).from(user).where(like(user.username, "pub-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      await db.delete(album).where(inArray(album.createdBy, ids));
      await db.delete(user).where(inArray(user.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `pub-${uniq}@x.io`,
      emailVerified: true, username: `pub-${uniq}`, role: "owner",
    }).returning();
    userId = u.id;
    const [u2] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "x", email: `pub-other-${uniq}@x.io`,
      emailVerified: true, username: `pub-other-${uniq}`, role: "owner",
    }).returning();
    otherUserId = u2.id;
    const [a] = await db.insert(album).values({ name: "Andini & Reza", createdBy: userId }).returning();
    albumId = a.id;
  });

  it("publishes album with slug and password hash", async () => {
    const r = await publishAlbum({ albumId, actorId: userId, password: "hunter2", downloadPolicy: "watermarked", expiresAt: null });
    expect(r.ok).toBe(true);
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.isPublic).toBe(true);
    expect(a.slug).toMatch(/^[a-z0-9]{5}-andini-reza$/);
    expect(a.passwordHash).toBeTruthy();
    expect(a.downloadPolicy).toBe("watermarked");
    expect(a.publishedAt).not.toBeNull();
  });

  it("publishes without password", async () => {
    const r = await publishAlbum({ albumId, actorId: userId, password: "", downloadPolicy: "none", expiresAt: null });
    expect(r.ok).toBe(true);
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.passwordHash).toBeNull();
  });

  it("rejects when actor is not creator", async () => {
    const r = await publishAlbum({ albumId, actorId: otherUserId, password: "", downloadPolicy: "none", expiresAt: null });
    expect(r.ok).toBe(false);
  });

  it("returns not-found for missing album", async () => {
    const r = await publishAlbum({ albumId: crypto.randomUUID(), actorId: userId, password: "", downloadPolicy: "none", expiresAt: null });
    expect(r.ok).toBe(false);
  });

  it("re-publish updates settings without regenerating slug", async () => {
    const first = await publishAlbum({ albumId, actorId: userId, password: "x", downloadPolicy: "none", expiresAt: null });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const slugFirst = first.slug;

    const second = await publishAlbum({ albumId, actorId: userId, password: "y", downloadPolicy: "watermarked", expiresAt: null });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.slug).toBe(slugFirst);

    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.downloadPolicy).toBe("watermarked");
  });
});
