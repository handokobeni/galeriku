import sharp from "sharp";
import { compositeWatermark } from "../lib/composite";
import { renderTextWatermark } from "../lib/text-renderer";
import { createJob, updateJob, getJob } from "../lib/job-store";
import { getWatermarkConfig } from "./get-watermark-config";
import type { Database } from "@/db";

const PREVIEW_WIDTH = 1200;

type MediaItem = {
  id: string;
  r2Key: string;
};

/**
 * Bulk generate watermarked variants for all photos in an album.
 * Tracks progress via in-memory job store. Skips on error per-photo.
 * Dependencies injected for testability.
 */
export async function generateWatermarks(input: {
  db: Database;
  albumId: string;
  mediaItems: MediaItem[];
  fetchR2: (key: string) => Promise<Buffer>;
  uploadR2: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  updateVariants: (mediaId: string, variants: Record<string, string>) => Promise<void>;
}): Promise<void> {
  const { db, albumId, mediaItems, fetchR2, uploadR2, updateVariants } = input;

  const job = createJob(albumId, mediaItems.length);

  if (mediaItems.length === 0) {
    updateJob(albumId, { status: "completed" });
    return;
  }

  const config = await getWatermarkConfig(db, albumId);

  // Fetch watermark source once (reuse for all photos)
  let watermarkBuffer: Buffer;
  if (config.mode === "logo") {
    if (!config.logoR2Key) {
      updateJob(albumId, { status: "failed", error: "No logo uploaded" });
      return;
    }
    watermarkBuffer = await fetchR2(config.logoR2Key);
  } else {
    watermarkBuffer = await renderTextWatermark(config.text, {
      opacity: config.opacity,
      scale: config.scale,
    });
  }

  for (const item of mediaItems) {
    try {
      // Fetch original photo
      const fotoBuffer = await fetchR2(item.r2Key);

      // Generate full-res watermarked
      const watermarkedFull = await compositeWatermark(fotoBuffer, watermarkBuffer, config);

      // Generate preview (1200px wide) watermarked
      const resizedFoto = await sharp(fotoBuffer).resize(PREVIEW_WIDTH).jpeg().toBuffer();
      const watermarkedPreview = await compositeWatermark(resizedFoto, watermarkBuffer, config);

      // Upload both to R2
      const fullKey = `watermarked/${albumId}/${item.id}-full.jpg`;
      const previewKey = `watermarked/${albumId}/${item.id}-preview.jpg`;
      await uploadR2(fullKey, watermarkedFull, "image/jpeg");
      await uploadR2(previewKey, watermarkedPreview, "image/jpeg");

      // Update media.variants
      await updateVariants(item.id, {
        watermarkedFull: fullKey,
        watermarkedPreview: previewKey,
      });

      // Track progress
      const current = getJob(albumId);
      updateJob(albumId, { done: (current?.done ?? 0) + 1 });
    } catch (err) {
      // Skip this photo, track in skipped list
      console.error(`[generateWatermarks] skipped ${item.id}:`, err);
      const current = getJob(albumId);
      if (current) {
        current.skipped.push(item.id);
        updateJob(albumId, {
          done: (current.done ?? 0) + 1,
          skipped: current.skipped,
        });
      }
    }
  }

  updateJob(albumId, { status: "completed" });
}
