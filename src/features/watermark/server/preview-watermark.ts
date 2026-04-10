import { compositeWatermark } from "../lib/composite";
import { renderTextWatermark } from "../lib/text-renderer";
import { getWatermarkConfig } from "./get-watermark-config";
import type { Database } from "@/db";

/**
 * Generate a single watermark preview for one photo.
 * Returns JPEG buffer. Dependencies injected for testability.
 */
export async function previewWatermark(input: {
  db: Database;
  albumId: string;
  fotoR2Key: string;
  fetchR2: (key: string) => Promise<Buffer>;
}): Promise<Buffer> {
  const { db, albumId, fotoR2Key, fetchR2 } = input;

  const config = await getWatermarkConfig(db, albumId);

  // Fetch the foto
  const fotoBuffer = await fetchR2(fotoR2Key);

  // Get watermark source
  let watermarkBuffer: Buffer;
  if (config.mode === "logo") {
    if (!config.logoR2Key) {
      throw new Error("No logo uploaded. Upload a logo first.");
    }
    watermarkBuffer = await fetchR2(config.logoR2Key);
  } else {
    watermarkBuffer = await renderTextWatermark(config.text);
  }

  return compositeWatermark(fotoBuffer, watermarkBuffer, config);
}
