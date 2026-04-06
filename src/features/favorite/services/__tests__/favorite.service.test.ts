import { describe, it, expect, vi } from "vitest";

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

describe("Favorite service", () => {
  it("exports toggleFavorite", () => { expect(typeof toggleFavorite).toBe("function"); });
  it("exports isFavorited", () => { expect(typeof isFavorited).toBe("function"); });
  it("exports getFavoritesForUser", () => { expect(typeof getFavoritesForUser).toBe("function"); });
  it("exports getFavoriteCount", () => { expect(typeof getFavoriteCount).toBe("function"); });
});
