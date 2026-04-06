"use client";

import { ArrowLeft, Users, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AlbumHeaderProps {
  albumId: string;
  name: string;
  mediaCount: number;
  canEdit: boolean;
  onUploadClick?: () => void;
  onMembersClick?: () => void;
}

export function AlbumHeader({
  name,
  mediaCount,
  canEdit,
  onUploadClick,
  onMembersClick,
}: AlbumHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <Link href="/albums" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{name}</h1>
          <p className="text-xs text-muted-foreground">{mediaCount} items</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={onMembersClick}>
          <Users className="size-4" />
        </Button>
        {canEdit && (
          <Button size="sm" className="rounded-xl gap-1.5" onClick={onUploadClick}>
            <Upload className="size-3.5" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}
