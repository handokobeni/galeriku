import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect, notFound } from "next/navigation";
import {
  getAlbumById,
  canAccessAlbum,
  canEditAlbum,
  getAlbumMembers,
} from "@/features/album/services/album.service";
import { getMediaForAlbum } from "@/features/media/services/media.service";
import { AlbumDetailClient } from "@/features/album/components/album-detail-client";

interface AlbumDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { id } = await params;
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;

  const albumData = await getAlbumById(id);
  if (!albumData) notFound();

  const hasAccess = await canAccessAlbum(id, session.user.id, userRole);
  if (!hasAccess) redirect("/albums");

  const hasEditAccess = await canEditAlbum(id, session.user.id, userRole);
  const [mediaItems, members] = await Promise.all([
    getMediaForAlbum(id),
    getAlbumMembers(id),
  ]);

  return (
    <AlbumDetailClient
      albumId={id}
      albumName={albumData.name}
      mediaItems={mediaItems}
      members={members}
      canEdit={hasEditAccess}
    />
  );
}
