import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect, notFound } from "next/navigation";
import { getMediaById } from "@/features/media/services/media.service";
import { canAccessAlbum, canEditAlbum } from "@/features/album/services/album.service";
import { getViewPresignedUrl, getDownloadPresignedUrl } from "@/shared/lib/r2";
import { getCommentsForMedia } from "@/features/comment/services/comment.service";
import { isFavorited } from "@/features/favorite/services/favorite.service";
import { getTagsForMedia } from "@/features/tag/services/tag.service";
import { MediaViewer } from "@/features/media/components/media-viewer";

interface MediaPageProps {
  params: Promise<{ id: string }>;
}

export default async function MediaPage({ params }: MediaPageProps) {
  const { id } = await params;
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(id);
  if (!mediaRecord) notFound();

  const userRole = session.user.role;
  const hasAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!hasAccess) redirect("/albums");

  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  const expiresIn = mediaRecord.type === "video" ? 14400 : 3600;

  const [viewUrl, downloadUrl, comments, favorited, tags] = await Promise.all([
    getViewPresignedUrl(mediaRecord.r2Key, expiresIn),
    getDownloadPresignedUrl(mediaRecord.r2Key, mediaRecord.filename),
    getCommentsForMedia(id),
    isFavorited(id, session.user.id),
    getTagsForMedia(id),
  ]);

  return (
    <MediaViewer
      media={mediaRecord}
      viewUrl={viewUrl}
      downloadUrl={downloadUrl}
      isFavorited={favorited}
      comments={comments}
      tags={tags}
      canEdit={canEdit}
    />
  );
}
