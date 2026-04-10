import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { canDownload, downloadVariantKey } from "@/features/guest-gallery/lib/access-control";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";
import { getDownloadPresignedUrl } from "@/shared/lib/r2";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) return new NextResponse(null, { status: 500 });

  const { slug, id } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });
  if (!canDownload(found.album)) return new NextResponse(null, { status: 403 });

  // Only require unlock cookie when album is password-protected.
  if (found.album.passwordHash) {
    const cookieStore = await cookies();
    const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
    const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
    if (!payload || payload.albumId !== found.album.id) {
      return new NextResponse(null, { status: 401 });
    }
  }

  const [m] = await db
    .select()
    .from(media)
    .where(and(eq(media.id, id), eq(media.albumId, found.album.id)))
    .limit(1);
  if (!m) return new NextResponse(null, { status: 404 });

  // Pick the variant that matches the album's download policy.
  const variantKey = downloadVariantKey(found.album.downloadPolicy);
  if (variantKey === null) return new NextResponse(null, { status: 403 });

  const variants = m.variants ?? {};
  // 'clean'      → original (m.r2Key)
  // 'watermarked'→ variants.watermarkedFull (populated by C2 watermark engine)
  // Falls back to original if variant not yet generated.
  let key: string;
  if (variantKey === "original") {
    key = m.r2Key;
  } else {
    key = variants.watermarkedFull ?? m.r2Key;
  }

  const url = await getDownloadPresignedUrl(key, m.filename, 300);
  return NextResponse.redirect(url, 302);
}
