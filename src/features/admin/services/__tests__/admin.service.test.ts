import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
}));

import {
  getAdminStats,
  getAllUsersForAdmin,
  getAllAlbumsForAdmin,
  getStorageByAlbum,
} from "../admin.service";

describe("Admin service", () => {
  it("exports getAdminStats", () => { expect(typeof getAdminStats).toBe("function"); });
  it("exports getAllUsersForAdmin", () => { expect(typeof getAllUsersForAdmin).toBe("function"); });
  it("exports getAllAlbumsForAdmin", () => { expect(typeof getAllAlbumsForAdmin).toBe("function"); });
  it("exports getStorageByAlbum", () => { expect(typeof getStorageByAlbum).toBe("function"); });
});
