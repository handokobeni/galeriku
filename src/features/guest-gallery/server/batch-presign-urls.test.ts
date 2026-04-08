import { describe, expect, it } from "vitest";
import { batchPresignUrls } from "./batch-presign-urls";

const hasR2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_BUCKET_NAME;

describe.skipIf(!hasR2)("batchPresignUrls", () => {
  it("returns map of mediaId → urls (thumb + preview)", async () => {
    const items = [
      {
        id: "m1",
        r2Key: "test/m1.jpg",
        thumbnailR2Key: "test/m1-thumb.jpg",
        variants: { preview1200: "test/m1-preview.jpg" },
      },
      {
        id: "m2",
        r2Key: "test/m2.jpg",
        thumbnailR2Key: "test/m2-thumb.jpg",
        variants: {},
      },
    ];
    const result = await batchPresignUrls(items, 3600);
    expect(result.m1.thumbUrl).toMatch(/^https?:\/\//);
    expect(result.m1.previewUrl).toMatch(/^https?:\/\//);
    expect(result.m2.thumbUrl).toMatch(/^https?:\/\//);
    expect(result.m2.previewUrl).toMatch(/^https?:\/\//);
  });

  it("uses thumbnailR2Key when no thumb400 variant", async () => {
    const items = [
      { id: "x", r2Key: "test/x.jpg", thumbnailR2Key: "test/x-thumb.jpg", variants: {} },
    ];
    const result = await batchPresignUrls(items, 600);
    expect(result.x.thumbUrl).toContain("x-thumb.jpg");
  });
});

describe.skipIf(hasR2)("batchPresignUrls (skipped: no R2 env)", () => {
  it("placeholder", () => {
    expect(true).toBe(true);
  });
});
