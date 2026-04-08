import { NextResponse } from "next/server";
import { unlockAlbum } from "@/features/guest-gallery/server/unlock-album";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const clientKey = req.headers.get("x-forwarded-for") ?? "unknown";
  const result = await unlockAlbum({ slug, password: body.password ?? "", clientKey });

  if (!result.ok) {
    if (result.reason === "not-found") return new NextResponse(null, { status: 404 });
    if (result.reason === "rate-limited") return new NextResponse("Too many attempts", { status: 429 });
    return new NextResponse("Wrong password", { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(`gk_unlock_${result.albumId}`, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/g/${slug}`,
    maxAge: 24 * 60 * 60,
  });
  return res;
}
