import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { media, albumMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getObject } from "@/shared/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [mediaRecord] = await db
    .select()
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);

  if (!mediaRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  if (userRole !== "owner") {
    const [member] = await db
      .select()
      .from(albumMember)
      .where(
        and(
          eq(albumMember.albumId, mediaRecord.albumId),
          eq(albumMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const object = await getObject(mediaRecord.thumbnailR2Key);
    const body = await object.Body?.transformToByteArray();

    if (!body) {
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[thumbnail] Failed to fetch:", mediaRecord.thumbnailR2Key, err);
    return NextResponse.json({ error: "Failed to fetch thumbnail" }, { status: 500 });
  }
}
