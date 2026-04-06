import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getAlbumById, canAccessAlbum, canEditAlbum } from "@/features/album/services/album.service";
import { getMediaForAlbum } from "@/features/media/services/media.service";
import { AlbumHeader } from "@/features/album/components/album-header";
import { MediaGrid } from "@/features/media/components/media-grid";

interface AlbumDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";

  const albumData = await getAlbumById(id);
  if (!albumData) notFound();

  const hasAccess = await canAccessAlbum(id, session.user.id, userRole);
  if (!hasAccess) redirect("/albums");

  const hasEditAccess = await canEditAlbum(id, session.user.id, userRole);
  const mediaItems = await getMediaForAlbum(id);

  return (
    <div>
      <AlbumHeader
        albumId={id}
        name={albumData.name}
        mediaCount={mediaItems.length}
        canEdit={hasEditAccess}
      />
      <div className="px-2 lg:px-4">
        <MediaGrid items={mediaItems} />
      </div>
    </div>
  );
}
