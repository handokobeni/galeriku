import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1, name: "sunset" }]),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  },
}));

import { getTagsForMedia, addTagToMedia, removeTagFromMedia, findOrCreateTag, searchTags } from "../tag.service";
import { db } from "@/db";

describe("Tag service", () => {
  it("exports getTagsForMedia", () => { expect(typeof getTagsForMedia).toBe("function"); });
  it("exports addTagToMedia", () => { expect(typeof addTagToMedia).toBe("function"); });
  it("exports removeTagFromMedia", () => { expect(typeof removeTagFromMedia).toBe("function"); });
  it("exports findOrCreateTag", () => { expect(typeof findOrCreateTag).toBe("function"); });
  it("exports searchTags", () => { expect(typeof searchTags).toBe("function"); });
});

describe("Tag service behavior", () => {
  const dbMock = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReturnThis();
    dbMock.from.mockReturnThis();
    dbMock.where.mockReturnThis();
    dbMock.innerJoin.mockReturnThis();
    dbMock.insert.mockReturnThis();
    dbMock.values.mockReturnThis();
    dbMock.delete.mockReturnThis();
    dbMock.returning.mockResolvedValue([{ id: 1, name: "sunset" }]);
    dbMock.limit.mockResolvedValue([]);
    dbMock.onConflictDoNothing.mockResolvedValue(undefined);
  });

  it("getTagsForMedia queries with innerJoin", async () => {
    dbMock.where.mockResolvedValue([{ id: 1, name: "sunset" }]);
    const result = await getTagsForMedia("m1");
    expect(db.select).toHaveBeenCalled();
    expect(db.innerJoin).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("findOrCreateTag returns null for empty/invalid name", async () => {
    const result = await findOrCreateTag("   !!!   ");
    expect(result).toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("findOrCreateTag returns existing tag when found", async () => {
    dbMock.limit.mockResolvedValue([{ id: 1, name: "sunset" }]);
    const result = await findOrCreateTag("Sunset");
    expect(db.insert).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 1, name: "sunset" });
  });

  it("findOrCreateTag creates new tag when not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    dbMock.returning.mockResolvedValue([{ id: 2, name: "beach" }]);
    const result = await findOrCreateTag("beach");
    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: 2, name: "beach" });
  });

  it("addTagToMedia returns null for invalid tag name", async () => {
    const result = await addTagToMedia("m1", "!!!");
    expect(result).toBeNull();
  });

  it("addTagToMedia inserts media-tag relation and returns tag", async () => {
    dbMock.limit.mockResolvedValue([{ id: 1, name: "sunset" }]);
    const result = await addTagToMedia("m1", "sunset");
    expect(db.insert).toHaveBeenCalled();
    expect(db.onConflictDoNothing).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, name: "sunset" });
  });

  it("removeTagFromMedia calls delete with media and tag ids", async () => {
    dbMock.where.mockResolvedValue(undefined);
    await removeTagFromMedia("m1", 1);
    expect(db.delete).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
  });

  it("searchTags queries tags by ilike pattern", async () => {
    dbMock.where.mockResolvedValue([{ id: 1, name: "sunset" }]);
    const result = await searchTags("sun");
    expect(db.select).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });
});
