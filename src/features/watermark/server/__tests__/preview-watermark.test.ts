import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock composite
vi.mock("../../lib/composite", () => ({
  compositeWatermark: vi.fn().mockResolvedValue(Buffer.from("jpeg-output")),
}));

// Mock text-renderer
vi.mock("../../lib/text-renderer", () => ({
  renderTextWatermark: vi.fn().mockResolvedValue(Buffer.from("text-png")),
}));

// Mock get-watermark-config
vi.mock("../get-watermark-config", () => ({
  getWatermarkConfig: vi.fn(),
}));

import { previewWatermark } from "../preview-watermark";
import { compositeWatermark } from "../../lib/composite";
import { renderTextWatermark } from "../../lib/text-renderer";
import { getWatermarkConfig } from "../get-watermark-config";

describe("previewWatermark", () => {
  const mockDb = {} as any;
  const mockFetchR2 = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns JPEG buffer for logo mode", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "logo",
      logoR2Key: "watermarks/s1/logo.png",
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
    mockFetchR2
      .mockResolvedValueOnce(Buffer.from("foto-bytes"))   // foto
      .mockResolvedValueOnce(Buffer.from("logo-bytes"));   // logo

    const result = await previewWatermark({
      db: mockDb,
      albumId: "album-1",
      mediaId: "media-1",
      fetchR2: mockFetchR2,
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(compositeWatermark).toHaveBeenCalledWith(
      Buffer.from("foto-bytes"),
      Buffer.from("logo-bytes"),
      expect.objectContaining({ mode: "logo" }),
    );
  });

  it("returns JPEG buffer for text mode", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "text",
      logoR2Key: null,
      text: "My Studio",
      position: "bottom-right",
      opacity: 50,
      scale: 25,
    });
    mockFetchR2.mockResolvedValueOnce(Buffer.from("foto-bytes"));

    const result = await previewWatermark({
      db: mockDb,
      albumId: "album-1",
      mediaId: "media-1",
      fetchR2: mockFetchR2,
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(renderTextWatermark).toHaveBeenCalledWith("My Studio", {
      opacity: 50,
      scale: 25,
    });
  });

  it("throws when mode=logo but no logoR2Key", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "logo",
      logoR2Key: null,
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
    mockFetchR2.mockResolvedValueOnce(Buffer.from("foto"));

    await expect(
      previewWatermark({
        db: mockDb,
        albumId: "album-1",
        mediaId: "media-1",
        fetchR2: mockFetchR2,
      }),
    ).rejects.toThrow("No logo uploaded");
  });

  it("throws when foto cannot be fetched", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "logo",
      logoR2Key: "watermarks/s1/logo.png",
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
    mockFetchR2.mockRejectedValueOnce(new Error("R2 fetch failed"));

    await expect(
      previewWatermark({
        db: mockDb,
        albumId: "album-1",
        mediaId: "media-1",
        fetchR2: mockFetchR2,
      }),
    ).rejects.toThrow("R2 fetch failed");
  });
});
