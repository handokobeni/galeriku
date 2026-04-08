import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { like, inArray } from "drizzle-orm";
import { GET } from "./route";

describe("GET manifest.webmanifest", () => {
  beforeEach(async () => {
    const ours = await db.select({ id: album.id }).from(album).where(like(album.slug, "mft12-%"));
    if (ours.length) await db.delete(album).where(inArray(album.id, ours.map((x) => x.id)));
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `mft-${uniq}@x.io`,
      emailVerified: true, username: `mft-${uniq}`, role: "owner",
    }).returning();
    await db.insert(album).values({
      name: "Andini & Reza Wedding", slug: "mft12-andini-reza", isPublic: true, createdBy: u.id,
    });
    await db.insert(album).values({
      name: "Private", slug: "mft12-private", isPublic: false, createdBy: u.id,
    });
  });

  it("returns manifest JSON for published album", async () => {
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ slug: "mft12-andini-reza" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/manifest+json");
    const json = await res.json();
    expect(json.name).toBe("Andini & Reza Wedding");
    expect(json.start_url).toBe("/g/mft12-andini-reza");
    expect(json.scope).toBe("/g/mft12-andini-reza");
    expect(json.icons).toHaveLength(1);
    expect(json.icons[0].src).toBe("/g/mft12-andini-reza/cover.jpg");
  });

  it("returns 404 for non-public album", async () => {
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ slug: "mft12-private" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 for missing slug", async () => {
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ slug: "mft12-nope" }) });
    expect(res.status).toBe(404);
  });
});
