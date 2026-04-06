import { describe, it, expect, vi } from "vitest";

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

describe("Media service", () => {
  it("exports getMediaForAlbum", () => { expect(typeof getMediaForAlbum).toBe("function"); });
  it("exports getMediaById", () => { expect(typeof getMediaById).toBe("function"); });
  it("exports saveMediaBatch", () => { expect(typeof saveMediaBatch).toBe("function"); });
  it("exports deleteMediaById", () => { expect(typeof deleteMediaById).toBe("function"); });
});
