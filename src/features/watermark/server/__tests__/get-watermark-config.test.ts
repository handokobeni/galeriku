import { describe, expect, it, beforeAll } from "vitest";
import { db } from "@/db";
import { user, album, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWatermarkConfig } from "../get-watermark-config";
import { DEFAULTS } from "../../lib/config";

describe("getWatermarkConfig", () => {
  let userId: string;
  let albumId: string;
  const settingsKey = "watermark_config";

  beforeAll(async () => {
    // Clean settings
    await db.delete(appSettings).where(eq(appSettings.key, settingsKey));

    const [u] = await db
      .insert(user)
      .values({
        name: "wm7-owner",
        email: `wm7-${Date.now()}@test.io`,
        username: `wm7-user-${Date.now()}`,
        emailVerified: true,
        role: "owner",
      })
      .returning();
    userId = u.id;

    const [a] = await db
      .insert(album)
      .values({
        name: "wm7-album",
        createdBy: userId,
      })
      .returning();
    albumId = a.id;
  });

  it("returns DEFAULTS when no global config and no album override", async () => {
    const config = await getWatermarkConfig(db, albumId);
    expect(config).toEqual(DEFAULTS);
  });

  it("returns global config merged with defaults", async () => {
    await db
      .insert(appSettings)
      .values({
        key: settingsKey,
        value: { mode: "text", text: "Studio Pro", opacity: 70 },
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: { mode: "text", text: "Studio Pro", opacity: 70 }, updatedAt: new Date() },
      });

    const config = await getWatermarkConfig(db, albumId);
    expect(config.mode).toBe("text");
    expect(config.text).toBe("Studio Pro");
    expect(config.opacity).toBe(70);
    expect(config.position).toBe(DEFAULTS.position);
    expect(config.scale).toBe(DEFAULTS.scale);
  });

  it("merges album override over global config", async () => {
    await db
      .update(album)
      .set({ watermarkOverride: { position: "bottom-right", scale: 50 } })
      .where(eq(album.id, albumId));

    const config = await getWatermarkConfig(db, albumId);
    expect(config.mode).toBe("text");           // from global
    expect(config.text).toBe("Studio Pro");      // from global
    expect(config.opacity).toBe(70);             // from global
    expect(config.position).toBe("bottom-right"); // from album override
    expect(config.scale).toBe(50);               // from album override
  });

  it("handles album with no override (null)", async () => {
    await db
      .update(album)
      .set({ watermarkOverride: null })
      .where(eq(album.id, albumId));

    const config = await getWatermarkConfig(db, albumId);
    expect(config.position).toBe(DEFAULTS.position); // back to global/default
  });
});
