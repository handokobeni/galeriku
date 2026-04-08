import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { registerGuest } from "@/features/guest-gallery/server/register-guest";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const cookieStore = await cookies();
  const unlockToken = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
  const payload = unlockToken ? await verifyCookie<{ albumId: string }>(unlockToken, secret) : null;
  if (!payload || payload.albumId !== found.album.id) {
    return new NextResponse("Unlock required", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const clientKey = req.headers.get("x-forwarded-for") ?? "unknown";
  const r = await registerGuest({ albumId: found.album.id, name: body.name ?? "", clientKey });
  if (!r.ok) {
    if (r.reason === "rate-limited") return new NextResponse("Too many", { status: 429 });
    return new NextResponse("Invalid name", { status: 400 });
  }

  const res = NextResponse.json({ ok: true, guestId: r.guestId });
  res.cookies.set("gk_guest", r.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/g/${slug}`,
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
