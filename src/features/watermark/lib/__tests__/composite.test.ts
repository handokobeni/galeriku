import { describe, expect, it, vi, beforeEach } from "vitest";
import type { WatermarkConfig } from "../config";

// Mock sharp before importing composite
const mockComposite = vi.fn().mockReturnThis();
const mockJpeg = vi.fn().mockReturnThis();
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("composited"));
const mockMetadata = vi.fn().mockResolvedValue({ width: 2000, height: 1500 });
const mockResize = vi.fn().mockReturnThis();
const mockEnsureAlpha = vi.fn().mockReturnThis();
const mockToFormat = vi.fn().mockReturnThis();

const mockSharpInstance = {
  composite: mockComposite,
  jpeg: mockJpeg,
  toBuffer: mockToBuffer,
  metadata: mockMetadata,
  resize: mockResize,
  ensureAlpha: mockEnsureAlpha,
  toFormat: mockToFormat,
};

vi.mock("sharp", () => ({
  default: vi.fn(() => mockSharpInstance),
}));

import { compositeWatermark } from "../composite";

describe("compositeWatermark", () => {
  const fotoBuffer = Buffer.from("fake-foto");
  const watermarkBuffer = Buffer.from("fake-watermark");

  beforeEach(() => {
    vi.clearAllMocks();
    mockComposite.mockReturnThis();
    mockJpeg.mockReturnThis();
    mockToBuffer.mockResolvedValue(Buffer.from("composited"));
    mockMetadata.mockResolvedValue({ width: 2000, height: 1500 });
    mockResize.mockReturnThis();
  });

  const baseConfig: WatermarkConfig = {
    mode: "logo",
    logoR2Key: "logo.png",
    text: "",
    position: "center",
    opacity: 40,
    scale: 30,
  };

  it("calls sharp.composite with center gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, baseConfig);
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "centre" }),
    ]);
  });

  it("maps top-left to northwest gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "top-left",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "northwest" }),
    ]);
  });

  it("maps top-right to northeast gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "top-right",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "northeast" }),
    ]);
  });

  it("maps bottom-left to southwest gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "bottom-left",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "southwest" }),
    ]);
  });

  it("maps bottom-right to southeast gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "bottom-right",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "southeast" }),
    ]);
  });

  it("resizes watermark to scale% of foto width", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      scale: 30,
    });
    // 30% of 2000px = 600px
    expect(mockResize).toHaveBeenCalledWith(600);
  });

  it("returns a buffer", async () => {
    const result = await compositeWatermark(fotoBuffer, watermarkBuffer, baseConfig);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("calls jpeg for output format", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, baseConfig);
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 90 });
  });
});
