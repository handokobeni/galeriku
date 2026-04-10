import sharp from "sharp";

const MAX_TEXT_LENGTH = 100;

/**
 * Render text string to a PNG buffer with transparent background.
 * Used as watermark input when mode is "text".
 */
/**
 * Note: opacity is NOT applied here — it is handled by compositeWatermark()
 * which applies uniform opacity to the final composited watermark layer.
 * This function renders the text at full opacity so the composite pipeline
 * has a clean alpha to work with.
 */
export async function renderTextWatermark(
  text: string,
): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("text cannot be empty");
  }

  const safeText = trimmed.length > MAX_TEXT_LENGTH
    ? trimmed.slice(0, MAX_TEXT_LENGTH)
    : trimmed;

  // Escape XML entities
  const escaped = safeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const fontSize = 64;
  const padding = 20;
  // Approximate width: ~0.6em per character
  const estimatedWidth = Math.ceil(escaped.length * fontSize * 0.6) + padding * 2;
  const height = fontSize + padding * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${estimatedWidth}" height="${height}">
    <text
      x="50%"
      y="50%"
      dominant-baseline="central"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      fill="white"
      opacity="1"
    >${escaped}</text>
  </svg>`;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
