"use client";

import { useState } from "react";
import { AlbumHeader } from "./album-header";
import { MembersDialog } from "./members-dialog";
import { PublishAlbumDialog } from "./publish-album-dialog";
import { publishAlbumAction } from "../actions/publish-album.action";
import { MediaGrid } from "@/features/media/components/media-grid";
import { UploadDialog } from "@/features/media/components/upload-dialog";
import { WatermarkPreviewModal } from "@/features/watermark/components/watermark-preview-modal";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import type { MediaWithUploader } from "@/features/media/types";
import type { AlbumMemberInfo } from "../types";

interface AlbumDetailClientProps {
  albumId: string;
  albumName: string;
  mediaItems: MediaWithUploader[];
  members: AlbumMemberInfo[];
  canEdit: boolean;
  canManage: boolean;
  currentUserId: string;
  isPublished?: boolean;
  downloadPolicy?: string;
  slug?: string | null;
}

export function AlbumDetailClient({
  albumId,
  albumName,
  mediaItems,
  members,
  canEdit,
  canManage,
  currentUserId,
  isPublished,
  downloadPolicy,
  slug,
}: AlbumDetailClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function handlePreviewWatermark() {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });

      if (!res.ok) {
        setPreviewLoading(false);
        return;
      }

      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div>
      <AlbumHeader
        albumId={albumId}
        name={albumName}
        mediaCount={mediaItems.length}
        canEdit={canEdit}
        onUploadClick={() => setUploadOpen(true)}
        onMembersClick={() => setMembersOpen(true)}
      />
      <div className="px-6 lg:px-12 max-w-[1600px] mx-auto">
        <MediaGrid items={mediaItems} />
      </div>

      {canEdit && (
        <UploadDialog
          albumId={albumId}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      )}

      <MembersDialog
        albumId={albumId}
        members={members}
        canManage={canManage}
        currentUserId={currentUserId}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />

      {canManage && (
        <div className="px-6 lg:px-12 max-w-[1600px] mx-auto py-10 mt-6 border-t border-border/60">
          {/* Re-publish hint when album is published with watermark */}
          {isPublished && downloadPolicy === "watermarked" && (
            <div className="mb-6 flex items-start gap-3 rounded-md border border-accent/40 bg-accent/5 px-4 py-3">
              <AlertTriangle className="size-4 text-accent mt-0.5 shrink-0" />
              <div className="font-editorial text-sm">
                <p className="text-foreground font-medium">Watermark settings changed?</p>
                <p className="text-muted-foreground mt-0.5">
                  Klik <strong>Publish to client</strong> lagi untuk regenerate watermark dengan konfigurasi terbaru.
                  {slug && (
                    <> Gallery saat ini: <a href={`/g/${slug}`} target="_blank" className="text-primary underline">/g/{slug}</a></>
                  )}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label-eyebrow mb-2">Watermark & Share</p>
              <p className="font-editorial text-sm text-muted-foreground italic">
                {isPublished
                  ? "Re-publish to apply updated watermark settings"
                  : "Preview watermark, then publish this album to a public link"}
              </p>
            </div>
            <div className="flex gap-2">
              {mediaItems.length > 0 && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handlePreviewWatermark}
                >
                  <Eye className="size-4" />
                  Preview Watermark
                </Button>
              )}
              <PublishAlbumDialog albumId={albumId} onPublish={publishAlbumAction} />
            </div>
          </div>
        </div>
      )}

      <WatermarkPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }}
        onConfirm={() => {
          setPreviewOpen(false);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }}
        previewUrl={previewUrl}
        loading={previewLoading}
      />
    </div>
  );
}
