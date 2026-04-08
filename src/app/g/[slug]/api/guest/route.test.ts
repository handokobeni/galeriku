import { describe, expect, it, beforeEach, vi } from "vitest";
import { db } from "@/db";
import { user, album, galleryGuests } from "@/db/schema";
import { like, inArray, eq } from "drizzle-orm";
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

import { POST } from "./route";

describe("POST /g/[slug]/api/guest", () => {
  let albumId: string;
  let slug: string;
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    cookieStore.clear();
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "grt12-%"));
    if (ours.length) {
      const ids = ours.map((x) => x.id);
      await db.delete(galleryGuests).where(inArray(galleryGuests.albumId, ids));
      await db.delete(album).where(inArray(album.id, ids));
    }
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `grt-${uniq}@x.io`,
      emailVerified: true, username: `grt-${uniq}`, role: "owner",
    }).returning();
    slug = `grt12-x-${uniq.slice(0, 8)}`;
    const [a] = await db.insert(album).values({
      name: "X", slug, isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
  });

  it("requires unlock cookie", async () => {
    const req = new Request(`http://localhost/g/${slug}/api/guest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Sinta" }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(401);
  });

  it("creates guest with valid unlock cookie", async () => {
    const token = await signCookie({ albumId, exp: Date.now() + 60_000 }, SECRET);
    cookieStore.set(`gk_unlock_${albumId}`, token);
    const req = new Request(`http://localhost/g/${slug}/api/guest`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `1.2.3.${Date.now() % 255}`,
      },
      body: JSON.stringify({ name: "Sinta" }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("gk_guest");
    const guests = await db.select().from(galleryGuests).where(eq(galleryGuests.albumId, albumId));
    expect(guests).toHaveLength(1);
  });
});
