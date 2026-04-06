import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { canEditAlbum } from "@/features/album/services/album.service";
import { getUploadPresignedUrl, buildOriginalKey, buildThumbnailKey } from "@/shared/lib/r2";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_PHOTO_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

const presignSchema = z.object({
  albumId: z.string().uuid(),
  files: z.array(
    z.object({
      id: z.string().uuid(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().positive(),
      ext: z.string(),
    })
  ).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { albumId, files } = parsed.data;
  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";

  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  for (const file of files) {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: `Unsupported file type: ${file.mimeType}` }, { status: 400 });
    }
    if (isImage && file.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: `Photo too large: ${file.filename}` }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: `Video too large: ${file.filename}` }, { status: 400 });
    }
  }

  const presignedUrls = await Promise.all(
    files.map(async (file) => {
      const originalKey = buildOriginalKey(albumId, file.id, file.ext);
      const thumbnailKey = buildThumbnailKey(file.id);

      const [originalUrl, thumbnailUrl] = await Promise.all([
        getUploadPresignedUrl(originalKey, file.mimeType),
        getUploadPresignedUrl(thumbnailKey, "image/webp"),
      ]);

      return { fileId: file.id, originalUrl, originalKey, thumbnailUrl, thumbnailKey };
    })
  );

  return NextResponse.json({ presignedUrls });
}
