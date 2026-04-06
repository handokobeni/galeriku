"use client";

import { useState } from "react";
import { AlbumHeader } from "./album-header";
import { MembersDialog } from "./members-dialog";
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
}

export function AlbumDetailClient({
  albumId,
  albumName,
  mediaItems,
  members,
  canEdit,
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
      <div className="px-2 lg:px-4">
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
        canEdit={canEdit}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />
    </div>
  );
}
