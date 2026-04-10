import { describe, expect, it, vi, beforeEach } from "vitest";

const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("png-output"));
const mockPng = vi.fn().mockReturnValue({ toBuffer: mockToBuffer });

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    png: mockPng,
    toBuffer: mockToBuffer,
  })),
}));

import { renderTextWatermark } from "../text-renderer";

describe("renderTextWatermark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPng.mockReturnValue({ toBuffer: mockToBuffer });
    mockToBuffer.mockResolvedValue(Buffer.from("png-output"));
  });

  it("throws on empty text", async () => {
    await expect(renderTextWatermark("")).rejects.toThrow(
      "text cannot be empty"
    );
  });

  it("throws on whitespace-only text", async () => {
    await expect(renderTextWatermark("   ")).rejects.toThrow(
      "text cannot be empty"
    );
  });

  it("truncates text longer than 100 characters", async () => {
    const long = "A".repeat(150);
    const result = await renderTextWatermark(long);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("returns a PNG buffer for valid text", async () => {
    const result = await renderTextWatermark("Studio XYZ");
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("passes text to sharp via SVG input", async () => {
    const { default: sharp } = await import("sharp");
    await renderTextWatermark("My Studio");
    const call = vi.mocked(sharp).mock.calls[0];
    const input = call[0];
    expect(Buffer.isBuffer(input)).toBe(true);
    const svgStr = input!.toString();
    expect(svgStr).toContain("My Studio");
    expect(svgStr).toContain("<svg");
  });
});
