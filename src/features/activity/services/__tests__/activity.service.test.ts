import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  },
}));

import { logActivity, getRecentActivity } from "../activity.service";

describe("Activity service", () => {
  it("exports logActivity", () => { expect(typeof logActivity).toBe("function"); });
  it("exports getRecentActivity", () => { expect(typeof getRecentActivity).toBe("function"); });
});

describe("Activity service behavior", () => {
  it("logActivity calls db.insert", async () => {
    const { db } = await import("@/db");
    await logActivity({
      userId: "u1",
      action: "login",
      entityType: "user",
    });
    expect(db.insert).toHaveBeenCalled();
  });

  it("getRecentActivity calls db.select", async () => {
    const { db } = await import("@/db");
    await getRecentActivity();
    expect(db.select).toHaveBeenCalled();
  });
});
