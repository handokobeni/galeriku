import sharp from "sharp";
import type { WatermarkConfig, WatermarkPosition } from "./config";

const GRAVITY_MAP: Record<WatermarkPosition, string> = {
  center: "centre",
  "top-left": "northwest",
  "top-right": "northeast",
  "bottom-left": "southwest",
  "bottom-right": "southeast",
};

/**
 * Composite a watermark buffer onto a foto buffer.
 * Returns JPEG buffer. Pure I/O -- no storage access.
 *
 * @param foto - Original photo buffer
 * @param watermark - Watermark image buffer (PNG with alpha)
 * @param config - Resolved watermark configuration
 */
export async function compositeWatermark(
  foto: Buffer,
  watermark: Buffer,
  config: WatermarkConfig,
): Promise<Buffer> {
  const fotoImage = sharp(foto);
  const metadata = await fotoImage.metadata();
  const fotoWidth = metadata.width ?? 2000;

  // Scale watermark to config.scale% of foto width
  const targetWidth = Math.round((config.scale / 100) * fotoWidth);
  const resizedWatermark = await sharp(watermark)
    .resize(targetWidth)
    .ensureAlpha()
    .toFormat("png")
    .composite([
      {
        // Apply opacity via a semi-transparent overlay
        input: Buffer.from(
          `<svg><rect x="0" y="0" width="${targetWidth}" height="9999" fill="white" opacity="${config.opacity / 100}"/></svg>`,
        ),
        blend: "dest-in",
      },
    ])
    .toBuffer();

  return fotoImage
    .composite([
      {
        input: resizedWatermark,
        gravity: GRAVITY_MAP[config.position],
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
