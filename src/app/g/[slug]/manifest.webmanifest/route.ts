import { NextResponse } from "next/server";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const manifest = {
    name: found.album.name,
    short_name: found.album.name.slice(0, 24),
    start_url: `/g/${slug}`,
    scope: `/g/${slug}`,
    display: "standalone",
    theme_color: "#FAF7F2",
    background_color: "#1A1A1A",
    icons: [
      { src: `/g/${slug}/cover.jpg`, sizes: "512x512", type: "image/jpeg", purpose: "any" },
    ],
  };
  return new NextResponse(JSON.stringify(manifest), {
    headers: { "content-type": "application/manifest+json" },
  });
}
