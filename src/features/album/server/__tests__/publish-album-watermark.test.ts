import { describe, expect, it, vi, beforeAll } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { eq } from "drizzle-orm";

// Mock watermark generation (it has its own tests)
vi.mock("@/features/watermark/server/generate-watermarks", () => ({
  generateWatermarks: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/watermark/lib/job-store", () => ({
  createJob: vi.fn().mockReturnValue({
    albumId: "test", total: 0, done: 0, status: "processing", skipped: [],
  }),
  getJob: vi.fn(),
  updateJob: vi.fn(),
}));

import { publishAlbum } from "../publish-album";

describe("publishAlbum with watermark integration", () => {
  let userId: string;
  let albumId: string;

  beforeAll(async () => {
    const [u] = await db
      .insert(user)
      .values({
        name: "wm13-owner",
        email: `wm13-${Date.now()}@test.io`,
        username: `wm13-user-${Date.now()}`,
        emailVerified: true,
        role: "owner",
      })
      .returning();
    userId = u.id;

    const [a] = await db
      .insert(album)
      .values({ name: "wm13-album", createdBy: userId })
      .returning();
    albumId = a.id;

    // Add a media item
    await db.insert(media).values({
      albumId,
      uploadedBy: userId,
      type: "photo",
      filename: "test.jpg",
      r2Key: `originals/${albumId}/test.jpg`,
      thumbnailR2Key: "thumb/test.webp",
      mimeType: "image/jpeg",
      sizeBytes: 1000,
    });
  });

  it("returns jobId when publishing with watermarked policy", async () => {
    const result = await publishAlbum({
      albumId,
      actorId: userId,
      password: "",
      downloadPolicy: "watermarked",
      expiresAt: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.slug).toBeDefined();
      expect(result.jobId).toBeDefined();
    }
  });

  it("does not return jobId for non-watermarked policy", async () => {
    const result = await publishAlbum({
      albumId,
      actorId: userId,
      password: "",
      downloadPolicy: "clean",
      expiresAt: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jobId).toBeUndefined();
    }
  });
});
