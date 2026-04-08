import { NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const coverId = found.album.coverMediaId ?? found.media[0]?.id;
  if (!coverId) return new NextResponse(null, { status: 404 });

  const [m] = await db.select().from(media).where(eq(media.id, coverId)).limit(1);
  if (!m) return new NextResponse(null, { status: 404 });

  const urls = await batchPresignUrls(
    [{ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} }],
    300,
  );
  return NextResponse.redirect(urls[m.id].previewUrl, 302);
}
