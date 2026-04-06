import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aws-sdk/client-s3", () => {
  const mockSend = vi.fn().mockResolvedValue({ Body: { transformToByteArray: vi.fn() } });
  const S3Client = vi.fn().mockImplementation(function () {
    return { send: mockSend };
  });
  return {
    S3Client,
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-url"),
}));

process.env.R2_ACCOUNT_ID = "test-account";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_BUCKET_NAME = "test-bucket";

import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  getViewPresignedUrl,
  getObject,
  deleteObject,
  buildOriginalKey,
  buildThumbnailKey,
} from "../r2";

describe("R2 key builders", () => {
  it("builds original key", () => {
    expect(buildOriginalKey("album-1", "media-1", "jpg")).toBe("originals/album-1/media-1.jpg");
  });
  it("builds thumbnail key", () => {
    expect(buildThumbnailKey("media-1")).toBe("thumbnails/media-1.webp");
  });
});

describe("R2 presigned URLs", () => {
  it("generates upload presigned URL", async () => {
    const url = await getUploadPresignedUrl("originals/a/b.jpg", "image/jpeg");
    expect(url).toBe("https://r2.example.com/signed-url");
  });
  it("generates download presigned URL", async () => {
    const url = await getDownloadPresignedUrl("originals/a/b.jpg", "photo.jpg");
    expect(url).toBe("https://r2.example.com/signed-url");
  });
  it("generates view presigned URL", async () => {
    const url = await getViewPresignedUrl("originals/a/b.jpg");
    expect(url).toBe("https://r2.example.com/signed-url");
  });
});

describe("R2 operations", () => {
  it("getObject returns response", async () => {
    const result = await getObject("thumbnails/media-1.webp");
    expect(result).toBeDefined();
  });
  it("deleteObject does not throw", async () => {
    await expect(deleteObject("originals/a/b.jpg")).resolves.not.toThrow();
  });
});
