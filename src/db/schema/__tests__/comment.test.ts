import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { comment, commentRelations } from "../comment";

describe("comment table", () => {
  it("has correct table name", () => { expect(getTableName(comment)).toBe("comment"); });
  it("has all required columns", () => {
    const columns = getTableColumns(comment);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("mediaId");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("content");
    expect(columns).toHaveProperty("createdAt");
  });
  it("exports commentRelations", () => { expect(commentRelations).toBeDefined(); });
});
