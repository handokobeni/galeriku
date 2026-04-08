import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { like, inArray } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { POST } from "./route";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("POST /g/[slug]/api/unlock", () => {
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "urt12-%"));
    if (ours.length) await db.delete(album).where(inArray(album.id, ours.map((x) => x.id)));
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `urt-${uniq}@x.io`,
      emailVerified: true, username: `urt-${uniq}`, role: "owner",
    }).returning();
    const ph = await hash("hunter2");
    await db.insert(album).values({
      name: "X", slug: "urt12-x", isPublic: true, passwordHash: ph, createdBy: u.id,
    });
  });

  it("sets cookie on correct password", async () => {
    const req = new Request("http://localhost/g/urt12-x/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `1.1.1.${Date.now() % 255}` },
      body: JSON.stringify({ password: "hunter2" }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: "urt12-x" }) });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("gk_unlock_");
  });

  it("returns 401 on wrong password", async () => {
    const req = new Request("http://localhost/g/urt12-x/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `2.2.2.${Date.now() % 255}` },
      body: JSON.stringify({ password: "wrong" }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: "urt12-x" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 on missing slug", async () => {
    const req = new Request("http://localhost/g/nope-zzz/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `3.3.3.${Date.now() % 255}` },
      body: JSON.stringify({ password: "x" }),
    });
    const res = await POST(req, { params: Promise.resolve({ slug: "nope-zzz" }) });
    expect(res.status).toBe(404);
  });
});
