import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
  },
}));

import { searchMedia } from "../search.service";
import { db } from "@/db";

describe("Search service", () => {
  it("exports searchMedia", () => { expect(typeof searchMedia).toBe("function"); });

  it("returns empty array for empty query", async () => {
    const results = await searchMedia("", "user-1", "member");
    expect(results).toEqual([]);
  });

  it("returns empty array for whitespace query", async () => {
    const results = await searchMedia("   ", "user-1", "member");
    expect(results).toEqual([]);
  });
});

describe("Search service behavior", () => {
  const dbMock = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReturnThis();
    dbMock.from.mockReturnThis();
    dbMock.where.mockResolvedValue([]);
    dbMock.innerJoin.mockReturnThis();
  });

  it("searchMedia as owner returns album results without member filter", async () => {
    // owner path: where resolves directly (no innerJoin for albumMember on first query)
    // Three queries: albums, media, tags — all return []
    dbMock.where.mockResolvedValue([]);
    const results = await searchMedia("test", "user-1", "owner");
    expect(db.select).toHaveBeenCalled();
    expect(Array.isArray(results)).toBe(true);
  });

  it("searchMedia as member uses innerJoin with albumMember", async () => {
    dbMock.where.mockResolvedValue([]);
    const results = await searchMedia("photo", "user-1", "member");
    expect(db.innerJoin).toHaveBeenCalled();
    expect(Array.isArray(results)).toBe(true);
  });

  it("searchMedia maps album results to SearchResult with type album", async () => {
    // First where call (album search) returns an album; others return []
    dbMock.where
      .mockResolvedValueOnce([{ id: "a1", name: "Vacation" }])
      .mockResolvedValue([]);
    const results = await searchMedia("Vacation", "user-1", "owner");
    expect(results.some((r) => r.type === "album" && r.id === "a1")).toBe(true);
  });

  it("searchMedia maps media results to SearchResult with type media", async () => {
    // album search returns [], media search returns a media record, tag search returns []
    dbMock.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "m1", filename: "photo.jpg", albumId: "a1", albumName: "Album", type: "photo" },
      ])
      .mockResolvedValue([]);
    const results = await searchMedia("photo", "user-1", "owner");
    expect(results.some((r) => r.type === "media" && r.id === "m1")).toBe(true);
  });

  it("searchMedia adds tag-matched media that is not already in results", async () => {
    // album empty, media empty, tag returns a match
    dbMock.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          mediaId: "m2", filename: "beach.jpg", albumId: "a1",
          albumName: "Summer", type: "photo", tagName: "beach",
        },
      ]);
    const results = await searchMedia("beach", "user-1", "owner");
    expect(results.some((r) => r.type === "media" && r.id === "m2")).toBe(true);
  });

  it("searchMedia deduplicates tag-matched media already found in filename search", async () => {
    // media search returns m1, tag search also returns m1 — result should only have one m1
    dbMock.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "m1", filename: "sunset.jpg", albumId: "a1", albumName: "Travels", type: "photo" },
      ])
      .mockResolvedValueOnce([
        {
          mediaId: "m1", filename: "sunset.jpg", albumId: "a1",
          albumName: "Travels", type: "photo", tagName: "sunset",
        },
      ]);
    const results = await searchMedia("sunset", "user-1", "owner");
    const mediaResults = results.filter((r) => r.type === "media" && r.id === "m1");
    expect(mediaResults.length).toBe(1);
  });
});
