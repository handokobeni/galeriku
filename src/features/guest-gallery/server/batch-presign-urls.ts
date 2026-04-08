import { getViewPresignedUrl } from "@/shared/lib/r2";

export type PresignableMedia = {
  id: string;
  r2Key: string;
  thumbnailR2Key: string;
  variants: { preview1200?: string; thumb400?: string; watermarkedFull?: string };
};

export type PresignedUrls = Record<string, { thumbUrl: string; previewUrl: string }>;

export async function batchPresignUrls(
  items: PresignableMedia[],
  ttlSeconds: number,
): Promise<PresignedUrls> {
  const out: PresignedUrls = {};
  await Promise.all(
    items.map(async (m) => {
      const thumbKey = m.variants.thumb400 ?? m.thumbnailR2Key;
      const previewKey = m.variants.preview1200 ?? m.r2Key;
      const [thumbUrl, previewUrl] = await Promise.all([
        getViewPresignedUrl(thumbKey, ttlSeconds),
        getViewPresignedUrl(previewKey, ttlSeconds),
      ]);
      out[m.id] = { thumbUrl, previewUrl };
    }),
  );
  return out;
}
