import { describe, it, expect, vi } from "vitest";

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

describe("Tag service", () => {
  it("exports getTagsForMedia", () => { expect(typeof getTagsForMedia).toBe("function"); });
  it("exports addTagToMedia", () => { expect(typeof addTagToMedia).toBe("function"); });
  it("exports removeTagFromMedia", () => { expect(typeof removeTagFromMedia).toBe("function"); });
  it("exports findOrCreateTag", () => { expect(typeof findOrCreateTag).toBe("function"); });
  it("exports searchTags", () => { expect(typeof searchTags).toBe("function"); });
});
