import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getMediaById } from "@/features/media/services/media.service";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getViewPresignedUrl, getDownloadPresignedUrl } from "@/shared/lib/r2";
import { MediaViewer } from "@/features/media/components/media-viewer";

interface MediaPageProps {
  params: Promise<{ id: string }>;
}

export default async function MediaPage({ params }: MediaPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(id);
  if (!mediaRecord) notFound();

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const hasAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!hasAccess) redirect("/albums");

  const expiresIn = mediaRecord.type === "video" ? 14400 : 3600;
  const [viewUrl, downloadUrl] = await Promise.all([
    getViewPresignedUrl(mediaRecord.r2Key, expiresIn),
    getDownloadPresignedUrl(mediaRecord.r2Key, mediaRecord.filename),
  ]);

  return <MediaViewer media={mediaRecord} viewUrl={viewUrl} downloadUrl={downloadUrl} />;
}
