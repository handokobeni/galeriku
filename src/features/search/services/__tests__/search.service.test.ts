import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockResolvedValue([]),
  },
}));

import { searchMedia } from "../search.service";

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
