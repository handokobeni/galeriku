import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { favorite } from "../favorite";

describe("favorite table", () => {
  it("has correct table name", () => { expect(getTableName(favorite)).toBe("favorite"); });
  it("has all required columns", () => {
    const columns = getTableColumns(favorite);
    expect(columns).toHaveProperty("mediaId");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("createdAt");
  });
});
