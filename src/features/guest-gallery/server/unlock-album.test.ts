import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { like } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { unlockAlbum } from "./unlock-album";
import { verifyCookie } from "../lib/cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("unlockAlbum", () => {
  let userId: string;
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(album).where(like(album.slug, "unl12-%"));
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `unl-${uniq}@x.io`,
      emailVerified: true, username: `unl-${uniq}`, role: "owner",
    }).returning();
    userId = u.id;
  });

  it("returns ok with token for correct password", async () => {
    const ph = await hash("hunter2");
    const [a] = await db.insert(album).values({
      name: "X", slug: "unl12-x", isPublic: true, passwordHash: ph, createdBy: userId,
    }).returning();
    const r = await unlockAlbum({ slug: "unl12-x", password: "hunter2", clientKey: "ip1" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const payload = await verifyCookie<{ albumId: string }>(r.token, SECRET);
      expect(payload?.albumId).toBe(a.id);
    }
  });

  it("returns ok=false for wrong password", async () => {
    const ph = await hash("hunter2");
    await db.insert(album).values({
      name: "X", slug: "unl12-a", isPublic: true, passwordHash: ph, createdBy: userId,
    });
    const r = await unlockAlbum({ slug: "unl12-a", password: "WRONG", clientKey: "ip2" });
    expect(r.ok).toBe(false);
  });

  it("returns ok for album with no password (no-op unlock)", async () => {
    await db.insert(album).values({
      name: "X", slug: "unl12-y", isPublic: true, createdBy: userId,
    });
    const r = await unlockAlbum({ slug: "unl12-y", password: "", clientKey: "ip3" });
    expect(r.ok).toBe(true);
  });

  it("returns not-found for missing slug", async () => {
    const r = await unlockAlbum({ slug: "nope", password: "x", clientKey: "ip4" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-found");
  });

  it("rate-limits after 5 attempts", async () => {
    const ph = await hash("hunter2");
    await db.insert(album).values({
      name: "X", slug: "unl12-z", isPublic: true, passwordHash: ph, createdBy: userId,
    });
    for (let i = 0; i < 5; i++) {
      await unlockAlbum({ slug: "unl12-z", password: "WRONG", clientKey: "ratekey" });
    }
    const r = await unlockAlbum({ slug: "unl12-z", password: "hunter2", clientKey: "ratekey" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });
});
