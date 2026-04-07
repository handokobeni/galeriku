import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { activityLog } from "../activity-log";

describe("activityLog table", () => {
  it("has correct table name", () => {
    expect(getTableName(activityLog)).toBe("activity_log");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(activityLog);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("action");
    expect(columns).toHaveProperty("entityType");
    expect(columns).toHaveProperty("entityId");
    expect(columns).toHaveProperty("metadata");
    expect(columns).toHaveProperty("ipAddress");
    expect(columns).toHaveProperty("userAgent");
    expect(columns).toHaveProperty("createdAt");
  });
});
