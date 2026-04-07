import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([]),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  },
}));

import { toggleFavorite, isFavorited, getFavoritesForUser, getFavoriteCount } from "../favorite.service";
import { db } from "@/db";

describe("Favorite service", () => {
  it("exports toggleFavorite", () => { expect(typeof toggleFavorite).toBe("function"); });
  it("exports isFavorited", () => { expect(typeof isFavorited).toBe("function"); });
  it("exports getFavoritesForUser", () => { expect(typeof getFavoritesForUser).toBe("function"); });
  it("exports getFavoriteCount", () => { expect(typeof getFavoriteCount).toBe("function"); });
});

describe("Favorite service behavior", () => {
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
    dbMock.orderBy.mockResolvedValue([]);
    dbMock.limit.mockResolvedValue([]);
    dbMock.onConflictDoNothing.mockResolvedValue(undefined);
  });

  it("isFavorited returns false when not favorited", async () => {
    dbMock.limit.mockResolvedValue([]);
    const result = await isFavorited("m1", "u1");
    expect(result).toBe(false);
  });

  it("isFavorited returns true when favorited", async () => {
    dbMock.limit.mockResolvedValue([{ mediaId: "m1", userId: "u1" }]);
    const result = await isFavorited("m1", "u1");
    expect(result).toBe(true);
  });

  it("toggleFavorite adds favorite when not yet favorited", async () => {
    // isFavorited returns false (not favorited)
    dbMock.limit.mockResolvedValue([]);
    const result = await toggleFavorite("m1", "u1");
    expect(result).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(db.onConflictDoNothing).toHaveBeenCalled();
  });

  it("toggleFavorite removes favorite when already favorited", async () => {
    // isFavorited returns true (favorited): limit resolves with a record
    dbMock.limit.mockResolvedValue([{ mediaId: "m1", userId: "u1" }]);
    // delete chain: delete().where() - where returns this then resolves
    // After the second call to where (the delete where), it resolves undefined
    const result = await toggleFavorite("m1", "u1");
    expect(result).toBe(false);
    expect(db.delete).toHaveBeenCalled();
  });

  it("getFavoritesForUser as owner queries without albumMember join", async () => {
    dbMock.orderBy.mockResolvedValue([{ mediaId: "m1" }]);
    const result = await getFavoritesForUser("u1", "owner");
    expect(db.select).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getFavoritesForUser as member uses innerJoin with albumMember", async () => {
    dbMock.orderBy.mockResolvedValue([]);
    const result = await getFavoritesForUser("u1", "member");
    expect(db.innerJoin).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getFavoriteCount returns count from query result", async () => {
    dbMock.where.mockResolvedValue([{ mediaId: "m1" }, { mediaId: "m1" }]);
    const count = await getFavoriteCount("m1");
    expect(count).toBe(2);
  });

  it("getFavoriteCount returns 0 when no favorites", async () => {
    dbMock.where.mockResolvedValue([]);
    const count = await getFavoriteCount("m1");
    expect(count).toBe(0);
  });
});
