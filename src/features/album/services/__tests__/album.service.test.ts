import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "album-1", name: "Test" }]),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  },
}));

import {
  createAlbum,
  getAlbumById,
  getAlbumsForUser,
  updateAlbum,
  deleteAlbum,
  canAccessAlbum,
  canEditAlbum,
  canManageAlbum,
  getAlbumMembers,
  addAlbumMember,
  removeAlbumMember,
  updateMemberRole,
} from "../album.service";
import { db } from "@/db";

describe("Album service", () => {
  it("exports createAlbum", () => { expect(typeof createAlbum).toBe("function"); });
  it("exports getAlbumById", () => { expect(typeof getAlbumById).toBe("function"); });
  it("exports getAlbumsForUser", () => { expect(typeof getAlbumsForUser).toBe("function"); });
  it("exports updateAlbum", () => { expect(typeof updateAlbum).toBe("function"); });
  it("exports deleteAlbum", () => { expect(typeof deleteAlbum).toBe("function"); });
  it("exports canAccessAlbum", () => { expect(typeof canAccessAlbum).toBe("function"); });
  it("exports canEditAlbum", () => { expect(typeof canEditAlbum).toBe("function"); });
  it("exports getAlbumMembers", () => { expect(typeof getAlbumMembers).toBe("function"); });
  it("exports addAlbumMember", () => { expect(typeof addAlbumMember).toBe("function"); });
  it("exports removeAlbumMember", () => { expect(typeof removeAlbumMember).toBe("function"); });
  it("exports updateMemberRole", () => { expect(typeof updateMemberRole).toBe("function"); });
  it("exports canManageAlbum", () => { expect(typeof canManageAlbum).toBe("function"); });
});

describe("Album permission logic", () => {
  it("canAccessAlbum returns true for owner role", async () => {
    const result = await canAccessAlbum("album-1", "user-1", "owner");
    expect(result).toBe(true);
  });

  it("canEditAlbum returns true for owner role", async () => {
    const result = await canEditAlbum("album-1", "user-1", "owner");
    expect(result).toBe(true);
  });

  it("canManageAlbum returns true for owner role", async () => {
    const result = await canManageAlbum("album-1", "user-1", "owner");
    expect(result).toBe(true);
  });
});

describe("Album service behavior", () => {
  const dbMock = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReturnThis();
    dbMock.from.mockReturnThis();
    dbMock.where.mockReturnThis();
    dbMock.leftJoin.mockReturnThis();
    dbMock.innerJoin.mockReturnThis();
    dbMock.insert.mockReturnThis();
    dbMock.values.mockReturnThis();
    dbMock.delete.mockReturnThis();
    dbMock.update.mockReturnThis();
    dbMock.set.mockReturnThis();
    dbMock.orderBy.mockReturnThis();
    dbMock.onConflictDoNothing.mockResolvedValue(undefined);
    dbMock.returning.mockResolvedValue([{ id: "album-1", name: "Test" }]);
    dbMock.limit.mockResolvedValue([]);
  });

  it("createAlbum inserts album and member, returns new album", async () => {
    dbMock.returning
      .mockResolvedValueOnce([{ id: "album-1", name: "My Album" }])
      .mockResolvedValueOnce([]);
    const result = await createAlbum({ name: "My Album", createdBy: "user-1" });
    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: "album-1", name: "My Album" });
  });

  it("getAlbumsForUser with owner role calls orderBy without innerJoin filter", async () => {
    dbMock.orderBy.mockResolvedValue([{ id: "album-1", name: "Test" }]);
    const result = await getAlbumsForUser("user-1", "owner");
    expect(db.select).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAlbumsForUser with member role uses innerJoin and where", async () => {
    dbMock.orderBy.mockResolvedValue([]);
    const result = await getAlbumsForUser("user-1", "member");
    expect(db.innerJoin).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAlbumById returns album when found", async () => {
    dbMock.limit.mockResolvedValue([{ id: "album-1", name: "Test" }]);
    const result = await getAlbumById("album-1");
    expect(result).toEqual({ id: "album-1", name: "Test" });
  });

  it("getAlbumById returns null when not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    const result = await getAlbumById("nonexistent");
    expect(result).toBeNull();
  });

  it("updateAlbum calls update and set and where", async () => {
    await updateAlbum("album-1", { name: "Updated" });
    expect(db.update).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
    expect(db.returning).toHaveBeenCalled();
  });

  it("deleteAlbum calls delete", async () => {
    dbMock.where.mockResolvedValue(undefined);
    await deleteAlbum("album-1");
    expect(db.delete).toHaveBeenCalled();
  });

  it("canAccessAlbum returns false when member not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    const result = await canAccessAlbum("album-1", "user-1", "member");
    expect(result).toBe(false);
  });

  it("canAccessAlbum returns true when member exists", async () => {
    dbMock.limit.mockResolvedValue([{ userId: "user-1" }]);
    const result = await canAccessAlbum("album-1", "user-1", "member");
    expect(result).toBe(true);
  });

  it("canEditAlbum returns false when no editor record found", async () => {
    dbMock.limit.mockResolvedValue([]);
    const result = await canEditAlbum("album-1", "user-1", "member");
    expect(result).toBe(false);
  });

  it("canEditAlbum returns true when editor record found", async () => {
    dbMock.limit.mockResolvedValue([{ userId: "user-1", role: "editor" }]);
    const result = await canEditAlbum("album-1", "user-1", "member");
    expect(result).toBe(true);
  });

  it("getAlbumMembers maps creator role to 'owner'", async () => {
    // First where() is for getAlbumById (chainable → limit). Second where() is the member query (terminal).
    let whereCallCount = 0;
    dbMock.where.mockImplementation(function (this: unknown) {
      whereCallCount++;
      if (whereCallCount === 1) return this; // chainable for getAlbumById
      return Promise.resolve([
        { userId: "user-1", userName: "Creator", userEmail: "c@test.com", role: "editor", invitedAt: new Date() },
        { userId: "user-2", userName: "Other", userEmail: "o@test.com", role: "viewer", invitedAt: new Date() },
      ]) as unknown;
    });
    dbMock.limit.mockResolvedValueOnce([{ id: "album-1", createdBy: "user-1" }]);

    const result = await getAlbumMembers("album-1");
    expect(result[0].role).toBe("owner");
    expect(result[1].role).toBe("viewer");
  });

  it("addAlbumMember calls insert with onConflictDoNothing", async () => {
    await addAlbumMember("album-1", "user-2", "viewer");
    expect(db.insert).toHaveBeenCalled();
    expect(db.onConflictDoNothing).toHaveBeenCalled();
  });

  it("removeAlbumMember calls delete", async () => {
    dbMock.where.mockResolvedValue(undefined);
    await removeAlbumMember("album-1", "user-2");
    expect(db.delete).toHaveBeenCalled();
  });

  it("updateMemberRole calls update with new role", async () => {
    dbMock.where.mockResolvedValue(undefined);
    await updateMemberRole("album-1", "user-2", "editor");
    expect(db.update).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalled();
  });

  it("canManageAlbum returns true for album creator", async () => {
    dbMock.limit.mockResolvedValue([{ id: "album-1", name: "Test", createdBy: "user-1" }]);
    const result = await canManageAlbum("album-1", "user-1", "member");
    expect(result).toBe(true);
  });

  it("canManageAlbum returns false for editor who is not album creator", async () => {
    dbMock.limit.mockResolvedValue([{ id: "album-1", name: "Test", createdBy: "user-creator" }]);
    const result = await canManageAlbum("album-1", "user-editor", "member");
    expect(result).toBe(false);
  });
});
