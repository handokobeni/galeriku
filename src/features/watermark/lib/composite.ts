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
 * Returns JPEG buffer. Pure I/O — no storage access (DIP).
 */
export async function compositeWatermark(
  foto: Buffer,
  watermark: Buffer,
  config: WatermarkConfig,
): Promise<Buffer> {
  const fotoImage = sharp(foto);
  const fotoMeta = await fotoImage.metadata();
  const fotoWidth = fotoMeta.width ?? 2000;

  // Scale watermark to config.scale% of foto width
  const targetWidth = Math.round((config.scale / 100) * fotoWidth);
  const resized = await sharp(watermark)
    .resize(targetWidth)
    .ensureAlpha()
    .toFormat("png")
    .toBuffer();

  // Apply opacity by extracting alpha channel, scaling it, and recombining.
  // This is more robust than the SVG dest-in approach which had fragile
  // sizing and relied on librsvg parsing.
  const resizedMeta = await sharp(resized).metadata();
  const { width: wmWidth = targetWidth, height: wmHeight = targetWidth } = resizedMeta;

  const opacityFactor = config.opacity / 100;
  const opacityMask = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${wmWidth}" height="${wmHeight}">` +
        `<rect width="100%" height="100%" fill="rgb(${Math.round(opacityFactor * 255)},${Math.round(opacityFactor * 255)},${Math.round(opacityFactor * 255)})"/>` +
        `</svg>`,
    ),
  )
    .greyscale()
    .toFormat("raw")
    .toBuffer();

  // Extract alpha from resized watermark, multiply by opacity mask, recombine
  const watermarkWithOpacity = await sharp(resized)
    .composite([
      {
        input: await sharp({
          create: {
            width: wmWidth,
            height: wmHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: opacityFactor },
          },
        })
          .png()
          .toBuffer(),
        blend: "dest-in",
      },
    ])
    .toBuffer();

  return fotoImage
    .composite([
      {
        input: watermarkWithOpacity,
        gravity: GRAVITY_MAP[config.position],
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
