import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { getAlbumMediaPage } from "@/features/guest-gallery/server/get-album-media-page";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  if (found.album.passwordHash) {
    const cookieStore = await cookies();
    const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
    const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
    if (!payload || payload.albumId !== found.album.id) {
      return new NextResponse(null, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "60"), 100);
  const cursor = url.searchParams.get("cursor");

  const page = await getAlbumMediaPage({ albumId: found.album.id, limit, cursor });
  const presigned = await batchPresignUrls(
    page.items.map((m) => ({ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} })),
    60 * 60,
  );
  const items = page.items.map((m) => ({
    id: m.id,
    thumbUrl: presigned[m.id].thumbUrl,
    previewUrl: presigned[m.id].previewUrl,
    width: m.width,
    height: m.height,
  }));
  return NextResponse.json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore });
}
