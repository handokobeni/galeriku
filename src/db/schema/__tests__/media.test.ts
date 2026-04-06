import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { media, mediaRelations } from "../media";

describe("media table", () => {
  it("has correct table name", () => {
    expect(getTableName(media)).toBe("media");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(media);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("albumId");
    expect(columns).toHaveProperty("uploadedBy");
    expect(columns).toHaveProperty("type");
    expect(columns).toHaveProperty("filename");
    expect(columns).toHaveProperty("r2Key");
    expect(columns).toHaveProperty("thumbnailR2Key");
    expect(columns).toHaveProperty("mimeType");
    expect(columns).toHaveProperty("sizeBytes");
    expect(columns).toHaveProperty("width");
    expect(columns).toHaveProperty("height");
    expect(columns).toHaveProperty("duration");
    expect(columns).toHaveProperty("createdAt");
  });
});

describe("media relations", () => {
  it("exports mediaRelations", () => { expect(mediaRelations).toBeDefined(); });
});
