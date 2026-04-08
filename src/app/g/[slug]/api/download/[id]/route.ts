import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";
import { canDownload } from "@/features/guest-gallery/lib/access-control";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const { slug, id } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });
  if (!canDownload(found.album)) return new NextResponse(null, { status: 403 });

  const cookieStore = await cookies();
  const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
  const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
  if (!payload || payload.albumId !== found.album.id) return new NextResponse(null, { status: 401 });

  const [m] = await db.select().from(media).where(and(eq(media.id, id), eq(media.albumId, found.album.id))).limit(1);
  if (!m) return new NextResponse(null, { status: 404 });

  const urls = await batchPresignUrls(
    [{ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} }],
    300,
  );
  return NextResponse.redirect(urls[m.id].previewUrl, 302);
}
