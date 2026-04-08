import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { galleryFavorites } from "@/db/schema";
import { getAlbumWithCountBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { getAlbumMediaPage } from "@/features/guest-gallery/server/get-album-media-page";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";
import { canViewAlbum } from "@/features/guest-gallery/lib/access-control";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";
import { PasswordGate } from "@/features/guest-gallery/components/password-gate";
import { GalleryGrid } from "@/features/guest-gallery/components/gallery-grid";
import { AlbumHeader } from "@/features/guest-gallery/components/album-header";
import { InstallPwaButton } from "@/features/guest-gallery/components/install-pwa-button";
import { OfflineToggle } from "@/features/guest-gallery/components/offline-toggle";

export default async function GuestGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getAlbumWithCountBySlug(slug);
  if (!found) notFound();

  const view = canViewAlbum(found.album);
  if (!view.ok && view.reason === "not-found") notFound();
  if (!view.ok && view.reason === "expired") {
    return (
      <div className="min-h-svh flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Album sudah berakhir</h1>
          <p className="text-gray-600">Hubungi photographer untuk link baru.</p>
        </div>
      </div>
    );
  }

  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) {
    throw new Error("GUEST_COOKIE_SECRET not configured");
  }
  const cookieStore = await cookies();

  if (found.album.passwordHash) {
    const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
    const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
    if (!payload || payload.albumId !== found.album.id) {
      return <PasswordGate slug={slug} />;
    }
  }

  const page = await getAlbumMediaPage({ albumId: found.album.id, limit: 60 });
  const presigned = await batchPresignUrls(
    page.items.map((m) => ({
      id: m.id,
      r2Key: m.r2Key,
      thumbnailR2Key: m.thumbnailR2Key,
      variants: m.variants ?? {},
    })),
    60 * 60,
  );
  const initialPhotos = page.items.map((m) => ({
    id: m.id,
    thumbUrl: presigned[m.id].thumbUrl,
    previewUrl: presigned[m.id].previewUrl,
    width: m.width,
    height: m.height,
  }));

  const guestTok = cookieStore.get("gk_guest")?.value;
  const guestPayload = guestTok
    ? await verifyCookie<{ guestId: string; albumId: string }>(guestTok, secret)
    : null;
  const hasGuest = !!guestPayload && guestPayload.albumId === found.album.id;
  const favorites = new Set<string>();
  if (hasGuest && guestPayload) {
    const favs = await db
      .select()
      .from(galleryFavorites)
      .where(eq(galleryFavorites.guestId, guestPayload.guestId));
    for (const f of favs) favorites.add(f.mediaId);
  }

  const coverUrl =
    initialPhotos.find((p) => p.id === found.album.coverMediaId)?.previewUrl ??
    initialPhotos[0]?.previewUrl ??
    null;

  return (
    <main>
      <AlbumHeader
        title={found.album.name}
        photoCount={found.mediaCount}
        coverUrl={coverUrl}
      />
      <div className="px-4 sm:px-6 py-6 flex flex-wrap gap-3 justify-between items-center">
        <p className="text-sm text-gray-600">{found.mediaCount} foto</p>
        <div className="flex gap-2">
          <InstallPwaButton />
          <OfflineToggle slug={slug} albumId={found.album.id} />
        </div>
      </div>
      <div className="px-1 sm:px-2">
        <GalleryGrid
          slug={slug}
          initialPhotos={initialPhotos}
          initialCursor={page.nextCursor}
          hasMore={page.hasMore}
          hasGuest={hasGuest}
          downloadPolicy={found.album.downloadPolicy}
          favorites={favorites}
        />
      </div>
      <footer className="py-10 text-center text-xs text-gray-500">
        Powered by Galeriku
      </footer>
    </main>
  );
}
