import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { tag, mediaTag, tagRelations, mediaTagRelations } from "../tag";

describe("tag table", () => {
  it("has correct table name", () => { expect(getTableName(tag)).toBe("tag"); });
  it("has id and name columns", () => {
    const columns = getTableColumns(tag);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("name");
  });
});
describe("mediaTag table", () => {
  it("has correct table name", () => { expect(getTableName(mediaTag)).toBe("media_tag"); });
  it("has composite key columns", () => {
    const columns = getTableColumns(mediaTag);
    expect(columns).toHaveProperty("mediaId");
    expect(columns).toHaveProperty("tagId");
  });
});
describe("tag relations", () => {
  it("exports tagRelations", () => { expect(tagRelations).toBeDefined(); });
  it("exports mediaTagRelations", () => { expect(mediaTagRelations).toBeDefined(); });
});
