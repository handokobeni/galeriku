import sharp from "sharp";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 2000;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

export type UploadLogoResult =
  | { ok: true; r2Key: string }
  | { ok: false; reason: string };

/**
 * Validate PNG, optionally resize, upload to R2, cleanup old logo.
 * Dependencies injected for testability (DIP).
 */
export async function uploadLogo(input: {
  buffer: Buffer;
  studioId: string;
  r2Upload: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  r2Delete: (key: string) => Promise<void>;
  oldLogoR2Key: string | null;
}): Promise<UploadLogoResult> {
  const { buffer, studioId, r2Upload, r2Delete, oldLogoR2Key } = input;

  // 1. Size check
  if (buffer.length > MAX_FILE_SIZE) {
    return { ok: false, reason: "File exceeds 2 MB limit" };
  }

  // 2. Magic bytes check
  if (!buffer.subarray(0, 4).equals(PNG_MAGIC)) {
    return { ok: false, reason: "File is not a valid PNG" };
  }

  // 3. Sharp metadata validation
  const meta = await sharp(buffer).metadata();
  if (meta.format !== "png") {
    return { ok: false, reason: "File is not a valid PNG" };
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return { ok: false, reason: "Logo too small (minimum 100×100px)" };
  }

  // 4. Auto-resize if > 2000px
  let finalBuffer = buffer;
  if (width > MAX_DIMENSION) {
    finalBuffer = await sharp(buffer).resize(MAX_DIMENSION).png().toBuffer();
  }

  // 5. Upload to R2
  const r2Key = `watermarks/${studioId}/logo-${Date.now()}.png`;
  await r2Upload(r2Key, finalBuffer, "image/png");

  // 6. Cleanup old logo
  if (oldLogoR2Key) {
    await r2Delete(oldLogoR2Key);
  }

  return { ok: true, r2Key };
}
