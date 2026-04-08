"use client";

import { useState } from "react";
import { AlbumHeader } from "./album-header";
import { MembersDialog } from "./members-dialog";
import { PublishAlbumDialog } from "./publish-album-dialog";
import { publishAlbumAction } from "../actions/publish-album.action";
import { MediaGrid } from "@/features/media/components/media-grid";
import { UploadDialog } from "@/features/media/components/upload-dialog";
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
}

export function AlbumDetailClient({
  albumId,
  albumName,
  mediaItems,
  members,
  canEdit,
  canManage,
  currentUserId,
}: AlbumDetailClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label-eyebrow mb-2">✦ Share with client</p>
              <p className="font-editorial text-sm text-muted-foreground italic">
                Publish this album to a public link your clients can view & favorite
              </p>
            </div>
            <PublishAlbumDialog albumId={albumId} onPublish={publishAlbumAction} />
          </div>
        </div>
      )}
    </div>
  );
}
