import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "c1", content: "test" }]),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
}));

import { getCommentsForMedia, addComment, deleteComment, getCommentCount } from "../comment.service";

describe("Comment service", () => {
  it("exports getCommentsForMedia", () => { expect(typeof getCommentsForMedia).toBe("function"); });
  it("exports addComment", () => { expect(typeof addComment).toBe("function"); });
  it("exports deleteComment", () => { expect(typeof deleteComment).toBe("function"); });
  it("exports getCommentCount", () => { expect(typeof getCommentCount).toBe("function"); });
});
