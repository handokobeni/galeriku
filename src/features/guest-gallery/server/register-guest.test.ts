import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, galleryGuests } from "@/db/schema";
import { eq, like, inArray } from "drizzle-orm";
import { registerGuest } from "./register-guest";
import { verifyCookie } from "../lib/cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("registerGuest", () => {
  let userId: string;
  let albumId: string;

  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "reg12-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      await db.delete(galleryGuests).where(inArray(galleryGuests.albumId, ids));
      await db.delete(album).where(inArray(album.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `reg-${uniq}@x.io`,
      emailVerified: true, username: `reg-${uniq}`, role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "X", slug: `reg12-${uniq.slice(0,8)}`, isPublic: true, createdBy: userId,
    }).returning();
    albumId = a.id;
  });

  it("inserts guest and returns signed token", async () => {
    const r = await registerGuest({ albumId, name: "Tante Sinta", clientKey: "ipA" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const guests = await db.select().from(galleryGuests).where(eq(galleryGuests.albumId, albumId));
      expect(guests).toHaveLength(1);
      expect(guests[0].displayName).toBe("Tante Sinta");
      const payload = await verifyCookie<{ guestId: string }>(r.token, SECRET);
      expect(payload?.guestId).toBe(guests[0].id);
    }
  });

  it("rejects empty name", async () => {
    const r = await registerGuest({ albumId, name: "  ", clientKey: "ipB" });
    expect(r.ok).toBe(false);
  });

  it("trims and stores name", async () => {
    const r = await registerGuest({ albumId, name: "  Sinta  ", clientKey: "ipC" });
    expect(r.ok).toBe(true);
    const guests = await db.select().from(galleryGuests).where(eq(galleryGuests.albumId, albumId));
    expect(guests[0].displayName).toBe("Sinta");
  });

  it("rate limits", async () => {
    for (let i = 0; i < 3; i++) {
      await registerGuest({ albumId, name: `n${i}`, clientKey: "rkey" });
    }
    const r = await registerGuest({ albumId, name: "n4", clientKey: "rkey" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });
});
