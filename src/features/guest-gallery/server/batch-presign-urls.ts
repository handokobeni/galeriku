import { getViewPresignedUrl } from "@/shared/lib/r2";

export type PresignableMedia = {
  id: string;
  r2Key: string;
  thumbnailR2Key: string;
  variants: {
    preview1200?: string;
    thumb400?: string;
    watermarkedFull?: string;
    watermarkedPreview?: string;
  };
};

export type PresignedUrls = Record<string, { thumbUrl: string; previewUrl: string }>;

/**
 * Generate batch presigned URLs for a list of media items.
 *
 * When downloadPolicy is "watermarked" AND watermarked variants exist,
 * the preview URL points to the watermarked version — this prevents
 * clients from viewing clean photos in the gallery and screenshot-ing
 * to bypass the watermark. Thumbnails still use the clean version
 * (too small to be useful as a bypass).
 */
export async function batchPresignUrls(
  items: PresignableMedia[],
  ttlSeconds: number,
  downloadPolicy: "none" | "watermarked" | "clean" = "none",
): Promise<PresignedUrls> {
  const useWatermarked = downloadPolicy === "watermarked";

  const out: PresignedUrls = {};
  await Promise.all(
    items.map(async (m) => {
      const thumbKey = m.variants.thumb400 ?? m.thumbnailR2Key;

      // For watermarked policy: show watermarked preview in gallery
      // so clients can't screenshot clean versions. Falls back to
      // clean preview if watermarked variant not yet generated.
      let previewKey: string;
      if (useWatermarked && m.variants.watermarkedPreview) {
        previewKey = m.variants.watermarkedPreview;
      } else {
        previewKey = m.variants.preview1200 ?? m.r2Key;
      }

      const [thumbUrl, previewUrl] = await Promise.all([
        getViewPresignedUrl(thumbKey, ttlSeconds),
        getViewPresignedUrl(previewKey, ttlSeconds),
      ]);
      out[m.id] = { thumbUrl, previewUrl };
    }),
  );
  return out;
}
