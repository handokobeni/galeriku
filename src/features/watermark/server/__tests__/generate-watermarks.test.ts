import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../lib/composite", () => ({
  compositeWatermark: vi.fn().mockResolvedValue(Buffer.from("composited")),
}));

vi.mock("../../lib/text-renderer", () => ({
  renderTextWatermark: vi.fn().mockResolvedValue(Buffer.from("text-wm")),
}));

vi.mock("../../lib/job-store", () => ({
  createJob: vi.fn().mockReturnValue({
    albumId: "a1",
    total: 0,
    done: 0,
    status: "processing",
    skipped: [],
  }),
  getJob: vi.fn(),
  updateJob: vi.fn(),
}));

vi.mock("../get-watermark-config", () => ({
  getWatermarkConfig: vi.fn().mockResolvedValue({
    mode: "logo",
    logoR2Key: "watermarks/s1/logo.png",
    text: "",
    position: "center",
    opacity: 40,
    scale: 30,
  }),
}));

// Mock sharp for resize
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("resized")),
  })),
}));

import { generateWatermarks } from "../generate-watermarks";
import { createJob, updateJob } from "../../lib/job-store";
import { compositeWatermark } from "../../lib/composite";

describe("generateWatermarks", () => {
  const mockDb = {} as any;
  const mockFetchR2 = vi.fn();
  const mockUploadR2 = vi.fn().mockResolvedValue(undefined);
  const mockUpdateVariants = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchR2.mockResolvedValue(Buffer.from("foto-bytes"));
  });

  it("completes immediately for 0 media items", async () => {
    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: [],
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    expect(createJob).toHaveBeenCalledWith("a1", 0);
    expect(updateJob).toHaveBeenCalledWith("a1", { status: "completed" });
  });

  it("generates watermarked variants for N photos", async () => {
    const items = [
      { id: "m1", r2Key: "originals/a1/m1.jpg" },
      { id: "m2", r2Key: "originals/a1/m2.jpg" },
      { id: "m3", r2Key: "originals/a1/m3.jpg" },
    ];

    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: items,
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    expect(createJob).toHaveBeenCalledWith("a1", 3);
    // 3 photos x 2 uploads (full + preview) = 6 uploads
    expect(mockUploadR2).toHaveBeenCalledTimes(6);
    // 3 photos x 1 variant update = 3 updates
    expect(mockUpdateVariants).toHaveBeenCalledTimes(3);
    expect(updateJob).toHaveBeenCalledWith("a1", { status: "completed" });
  });

  it("skips corrupt photo and continues", async () => {
    vi.mocked(compositeWatermark)
      .mockResolvedValueOnce(Buffer.from("ok"))        // m1 full
      .mockRejectedValueOnce(new Error("corrupt"))     // m2 full fails
      .mockResolvedValueOnce(Buffer.from("ok"))        // m3 full
      .mockResolvedValueOnce(Buffer.from("ok"))        // m1 preview
      .mockResolvedValueOnce(Buffer.from("ok"));       // m3 preview

    const items = [
      { id: "m1", r2Key: "originals/a1/m1.jpg" },
      { id: "m2", r2Key: "originals/a1/m2.jpg" },
      { id: "m3", r2Key: "originals/a1/m3.jpg" },
    ];

    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: items,
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    // m2 skipped: only 2 photos generated (4 uploads)
    expect(mockUpdateVariants).toHaveBeenCalledTimes(2);
    // Job still completes (not failed)
    expect(updateJob).toHaveBeenCalledWith("a1", { status: "completed" });
  });

  it("tracks progress via updateJob", async () => {
    const items = [
      { id: "m1", r2Key: "originals/a1/m1.jpg" },
      { id: "m2", r2Key: "originals/a1/m2.jpg" },
    ];

    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: items,
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    // done incremented for each processed photo
    const doneCalls = vi.mocked(updateJob).mock.calls.filter(
      (c) => typeof (c[1] as any).done === "number"
    );
    expect(doneCalls.length).toBeGreaterThanOrEqual(2);
  });
});
