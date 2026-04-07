import { describe, it, expect, vi, beforeEach } from "vitest";

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
import { db } from "@/db";

describe("Comment service", () => {
  it("exports getCommentsForMedia", () => { expect(typeof getCommentsForMedia).toBe("function"); });
  it("exports addComment", () => { expect(typeof addComment).toBe("function"); });
  it("exports deleteComment", () => { expect(typeof deleteComment).toBe("function"); });
  it("exports getCommentCount", () => { expect(typeof getCommentCount).toBe("function"); });
});

describe("Comment service behavior", () => {
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
    dbMock.returning.mockResolvedValue([{ id: "c1", content: "test" }]);
    dbMock.orderBy.mockResolvedValue([]);
  });

  it("getCommentsForMedia queries db with innerJoin and orderBy", async () => {
    dbMock.orderBy.mockResolvedValue([
      { id: "c1", content: "hello", userId: "u1" },
    ]);
    const result = await getCommentsForMedia("media-1");
    expect(db.select).toHaveBeenCalled();
    expect(db.innerJoin).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it("addComment inserts comment and returns it", async () => {
    dbMock.returning.mockResolvedValue([{ id: "c1", mediaId: "m1", content: "hello" }]);
    const result = await addComment("m1", "u1", "hello");
    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: "c1", mediaId: "m1", content: "hello" });
  });

  it("deleteComment calls delete with comment id", async () => {
    dbMock.where.mockResolvedValue(undefined);
    await deleteComment("c1");
    expect(db.delete).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
  });

  it("getCommentCount returns count of comments for media", async () => {
    dbMock.where.mockResolvedValue([{ id: "c1" }, { id: "c2" }]);
    const count = await getCommentCount("m1");
    expect(count).toBe(2);
  });

  it("getCommentCount returns 0 when no comments", async () => {
    dbMock.where.mockResolvedValue([]);
    const count = await getCommentCount("m1");
    expect(count).toBe(0);
  });
});
