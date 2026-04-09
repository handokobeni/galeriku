import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { toggleFavorite } from "@/features/guest-gallery/server/toggle-favorite";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";
import { getClientKey } from "@/features/guest-gallery/lib/client-ip";

async function handle(req: Request, slug: string, action: "add" | "remove") {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const cookieStore = await cookies();
  const guestToken = cookieStore.get("gk_guest")?.value;
  const payload = guestToken
    ? await verifyCookie<{ guestId: string; albumId: string }>(guestToken, secret)
    : null;
  if (!payload || payload.albumId !== found.album.id) {
    return new NextResponse("Guest required", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  // Use the guest cookie identity (already verified) as the rate-limit key.
  // It's stable per-guest and avoids per-IP collapse for many guests behind
  // the same NAT (a wedding venue).
  const clientKey = `${getClientKey(req)}:${payload.guestId}`;
  const r = await toggleFavorite({
    guestId: payload.guestId,
    mediaId: body.mediaId,
    albumId: found.album.id,
    action,
    clientKey,
  });
  if (!r.ok) {
    if (r.reason === "rate-limited") return new NextResponse(null, { status: 429 });
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handle(req, slug, "add");
}

export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handle(req, slug, "remove");
}
