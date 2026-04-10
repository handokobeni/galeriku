import { describe, expect, it, beforeAll } from "vitest";
import { db } from "@/db";
import { album } from "@/db/schema";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("watermark schema migration", () => {
  let albumId: string;

  beforeAll(async () => {
    const [u] = await db
      .insert(user)
      .values({
        name: "wm1-owner",
        email: `wm1-${Date.now()}@test.io`,
        username: `wm1-user-${Date.now()}`,
        emailVerified: true,
        role: "owner",
      })
      .returning();

    const [a] = await db
      .insert(album)
      .values({
        name: "wm1-test-album",
        createdBy: u.id,
      })
      .returning();
    albumId = a.id;
  });

  it("album has watermarkOverride column defaulting to null", async () => {
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a).toBeDefined();
    expect(a.watermarkOverride).toBeNull();
  });

  it("album accepts watermarkOverride jsonb data", async () => {
    const override = { mode: "text" as const, text: "Studio XYZ", opacity: 60 };
    await db
      .update(album)
      .set({ watermarkOverride: override })
      .where(eq(album.id, albumId));

    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.watermarkOverride).toEqual(override);
  });

  it("album watermarkOverride can be set back to null", async () => {
    await db
      .update(album)
      .set({ watermarkOverride: null })
      .where(eq(album.id, albumId));

    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.watermarkOverride).toBeNull();
  });
});
