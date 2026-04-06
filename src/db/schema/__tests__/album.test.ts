import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { album, albumMember, albumRelations, albumMemberRelations } from "../album";

describe("album table", () => {
  it("has correct table name", () => {
    expect(getTableName(album)).toBe("album");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(album);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("name");
    expect(columns).toHaveProperty("description");
    expect(columns).toHaveProperty("coverMediaId");
    expect(columns).toHaveProperty("createdBy");
    expect(columns).toHaveProperty("createdAt");
    expect(columns).toHaveProperty("updatedAt");
  });
});

describe("albumMember table", () => {
  it("has correct table name", () => {
    expect(getTableName(albumMember)).toBe("album_member");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(albumMember);
    expect(columns).toHaveProperty("albumId");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("role");
    expect(columns).toHaveProperty("invitedAt");
  });
});

describe("album relations", () => {
  it("exports albumRelations", () => { expect(albumRelations).toBeDefined(); });
  it("exports albumMemberRelations", () => { expect(albumMemberRelations).toBeDefined(); });
});
