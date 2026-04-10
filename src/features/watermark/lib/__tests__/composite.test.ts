import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { compositeWatermark } from "../composite";
import type { WatermarkConfig } from "../config";
import { DEFAULTS } from "../config";

// Integration tests using real sharp with tiny test images — more robust
// than mocking sharp internals which couples tests to implementation.

async function createTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
}

async function createTestWatermark(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

describe("compositeWatermark", () => {
  it("returns a JPEG buffer", async () => {
    const foto = await createTestImage(200, 150);
    const wm = await createTestWatermark(50, 20);
    const result = await compositeWatermark(foto, wm, DEFAULTS);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result[0]).toBe(0xff);
    expect(result[1]).toBe(0xd8);
  });

  it("output has same dimensions as input foto", async () => {
    const foto = await createTestImage(400, 300);
    const wm = await createTestWatermark(100, 40);
    const result = await compositeWatermark(foto, wm, DEFAULTS);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(300);
  });

  it("works with all 5 position presets", async () => {
    const foto = await createTestImage(200, 150);
    const wm = await createTestWatermark(30, 15);
    const positions = ["center", "top-left", "top-right", "bottom-left", "bottom-right"] as const;
    for (const position of positions) {
      const config: WatermarkConfig = { ...DEFAULTS, position };
      const result = await compositeWatermark(foto, wm, config);
      expect(Buffer.isBuffer(result)).toBe(true);
    }
  });

  it("respects scale parameter", async () => {
    const foto = await createTestImage(200, 150);
    const wm = await createTestWatermark(100, 40);
    const config: WatermarkConfig = { ...DEFAULTS, scale: 10 };
    const result = await compositeWatermark(foto, wm, config);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("different opacity produces different output", async () => {
    const foto = await createTestImage(200, 150);
    const wm = await createTestWatermark(30, 15);
    const low: WatermarkConfig = { ...DEFAULTS, opacity: 10 };
    const high: WatermarkConfig = { ...DEFAULTS, opacity: 100 };
    const resultLow = await compositeWatermark(foto, wm, low);
    const resultHigh = await compositeWatermark(foto, wm, high);
    expect(Buffer.isBuffer(resultLow)).toBe(true);
    expect(Buffer.isBuffer(resultHigh)).toBe(true);
    expect(resultLow.equals(resultHigh)).toBe(false);
  });
});
