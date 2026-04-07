import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/shared/lib/r2", () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

import {
  getMediaForAlbum,
  getMediaById,
  saveMediaBatch,
  deleteMediaById,
} from "../media.service";
import { db } from "@/db";
import { deleteObject } from "@/shared/lib/r2";

describe("Media service", () => {
  it("exports getMediaForAlbum", () => { expect(typeof getMediaForAlbum).toBe("function"); });
  it("exports getMediaById", () => { expect(typeof getMediaById).toBe("function"); });
  it("exports saveMediaBatch", () => { expect(typeof saveMediaBatch).toBe("function"); });
  it("exports deleteMediaById", () => { expect(typeof deleteMediaById).toBe("function"); });
});

describe("Media service behavior", () => {
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
    dbMock.orderBy.mockReturnThis();
    dbMock.returning.mockResolvedValue([]);
    // Default: limit resolves (used by getMediaById / deleteMediaById)
    dbMock.limit.mockResolvedValue([]);
    dbMock.offset.mockResolvedValue([]);
  });

  it("getMediaForAlbum queries db and returns results", async () => {
    // For getMediaForAlbum the chain is: ...orderBy().limit().offset()
    // Make limit return this so offset can be called
    dbMock.limit.mockReturnThis();
    dbMock.offset.mockResolvedValue([{ id: "m1", filename: "photo.jpg" }]);
    const result = await getMediaForAlbum("album-1", 1, 20);
    expect(db.select).toHaveBeenCalled();
    expect(db.innerJoin).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMediaForAlbum uses correct offset for page 2", async () => {
    dbMock.limit.mockReturnThis();
    dbMock.offset.mockResolvedValue([]);
    await getMediaForAlbum("album-1", 2, 10);
    expect(db.offset).toHaveBeenCalledWith(10);
  });

  it("getMediaById returns media when found", async () => {
    dbMock.limit.mockResolvedValue([{ id: "m1", filename: "photo.jpg" }]);
    const result = await getMediaById("m1");
    expect(result).toEqual({ id: "m1", filename: "photo.jpg" });
  });

  it("getMediaById returns null when not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    const result = await getMediaById("nonexistent");
    expect(result).toBeNull();
  });

  it("saveMediaBatch returns empty array when items is empty", async () => {
    const result = await saveMediaBatch([]);
    expect(result).toEqual([]);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("saveMediaBatch inserts and returns records", async () => {
    const mockRecord = { id: "m1", albumId: "a1", filename: "f.jpg" };
    dbMock.returning.mockResolvedValue([mockRecord]);
    const result = await saveMediaBatch([
      {
        id: "m1", albumId: "a1", uploadedBy: "u1", type: "photo",
        filename: "f.jpg", r2Key: "key/f.jpg", thumbnailR2Key: "key/thumb.jpg",
        mimeType: "image/jpeg", sizeBytes: 1024,
      },
    ]);
    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual([mockRecord]);
  });

  it("deleteMediaById does nothing when media not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    await deleteMediaById("nonexistent");
    expect(deleteObject).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("deleteMediaById deletes r2 objects and db record when found", async () => {
    // select chain returns the media record via limit
    dbMock.limit.mockResolvedValue([
      { id: "m1", r2Key: "key/f.jpg", thumbnailR2Key: "key/thumb.jpg" },
    ]);
    // delete chain: delete().where() - where should return this (not resolve)
    // where is already mockReturnThis from beforeEach
    await deleteMediaById("m1");
    expect(deleteObject).toHaveBeenCalledWith("key/f.jpg");
    expect(deleteObject).toHaveBeenCalledWith("key/thumb.jpg");
    expect(db.delete).toHaveBeenCalled();
  });
});
