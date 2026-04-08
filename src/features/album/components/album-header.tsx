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
    <header className="px-6 lg:px-12 pt-8 lg:pt-12 pb-8 max-w-[1600px] mx-auto">
      <Link
        href="/albums"
        className="inline-flex items-center gap-2 text-[11px] font-editorial tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
        Back to albums
      </Link>

      <div className="mt-6 flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow mb-3">✦ Collection</p>
          <h1 className="font-display text-4xl lg:text-6xl tracking-tight leading-[0.95] text-foreground break-words">
            {name}
          </h1>
          <p className="mt-4 font-editorial text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{mediaCount}</span>{" "}
            <span className="italic">{mediaCount === 1 ? "item" : "items"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onMembersClick}
            className="gap-2 font-editorial"
          >
            <Users className="size-4" strokeWidth={1.6} />
            Members
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={onUploadClick}
              className="gap-2 font-editorial bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="size-4" strokeWidth={1.8} />
              Upload
            </Button>
          )}
        </div>
      </div>

      <div className="divider-gold mt-8" />
    </header>
  );
}
