import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock sharp
const mockMetadata = vi.fn();
const mockResize = vi.fn().mockReturnThis();
const mockPng = vi.fn().mockReturnThis();
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("resized"));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    metadata: mockMetadata,
    resize: mockResize,
    png: mockPng,
    toBuffer: mockToBuffer,
  })),
}));

// Mock R2 helpers
vi.mock("@/shared/lib/r2", () => ({
  getObject: vi.fn(),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getViewPresignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/logo.png"),
}));

// Mock S3 PutObjectCommand
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

import { uploadLogo, type UploadLogoResult } from "../upload-logo";

describe("uploadLogo", () => {
  // Valid PNG magic bytes
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validPng = Buffer.concat([PNG_MAGIC, Buffer.alloc(100)]);

  // mockDb removed — upload-logo no longer takes db param (review fix #2)
  const _unused = {
  } as any;

  const mockR2Upload = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockMetadata.mockResolvedValue({ format: "png", width: 500, height: 200 });
    mockToBuffer.mockResolvedValue(Buffer.from("resized"));
  });

  it("rejects non-PNG (wrong magic bytes)", async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0)]);
    const result = await uploadLogo({
      buffer: jpegBuffer,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("PNG");
  });

  it("rejects file > 2MB", async () => {
    const bigBuffer = Buffer.concat([PNG_MAGIC, Buffer.alloc(2 * 1024 * 1024 + 1)]);
    const result = await uploadLogo({
      buffer: bigBuffer,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("2 MB");
  });

  it("rejects logo smaller than 100px", async () => {
    mockMetadata.mockResolvedValue({ format: "png", width: 50, height: 30 });
    const result = await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("too small");
  });

  it("auto-resizes logo > 2000px", async () => {
    mockMetadata.mockResolvedValue({ format: "png", width: 3000, height: 1000 });
    const result = await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(true);
    expect(mockResize).toHaveBeenCalledWith(2000);
  });

  it("accepts valid PNG and uploads to R2", async () => {
    const result = await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(true);
    expect(mockR2Upload).toHaveBeenCalledTimes(1);
    const callArgs = mockR2Upload.mock.calls[0];
    expect(callArgs[0]).toMatch(/^watermarks\/studio-1\/logo-/);
  });

  it("deletes old logo from R2 on re-upload", async () => {
    const r2Delete = vi.fn().mockResolvedValue(undefined);
    await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete,
      oldLogoR2Key: "watermarks/studio-1/logo-old.png",
    });
    expect(r2Delete).toHaveBeenCalledWith("watermarks/studio-1/logo-old.png");
  });

  it("does not delete if no old logo", async () => {
    const r2Delete = vi.fn();
    await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",

      r2Upload: mockR2Upload,
      r2Delete,
      oldLogoR2Key: null,
    });
    expect(r2Delete).not.toHaveBeenCalled();
  });
});
