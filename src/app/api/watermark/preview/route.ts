import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { previewWatermark } from "@/features/watermark/server/preview-watermark";
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getObject } from "@/shared/lib/r2";

async function fetchR2(key: string): Promise<Buffer> {
  const response = await getObject(key);
  const body = await response.Body?.transformToByteArray();
  if (!body) throw new Error(`Failed to fetch ${key} from R2`);
  return Buffer.from(body);
}

export async function POST(req: Request) {
  const session = await getSessionWithRole();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { albumId, mediaId } = body;

  if (!albumId) {
    return NextResponse.json({ error: "albumId required" }, { status: 400 });
  }

  // If no mediaId provided, pick the first photo in the album
  let targetR2Key: string;
  if (mediaId) {
    const [m] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);
    if (!m) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    targetR2Key = m.r2Key;
  } else {
    const [m] = await db
      .select()
      .from(media)
      .where(eq(media.albumId, albumId))
      .limit(1);
    if (!m) {
      return NextResponse.json({ error: "No photos in album" }, { status: 404 });
    }
    targetR2Key = m.r2Key;
  }

  try {
    const jpegBuffer = await previewWatermark({
      db,
      albumId,
      mediaId: targetR2Key,
      fetchR2,
    });

    return new NextResponse(new Uint8Array(jpegBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
