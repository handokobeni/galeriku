import Link from "next/link";
import { ImageIcon, Users } from "lucide-react";
import type { AlbumWithMeta } from "../types";

interface AlbumCardProps {
  album: AlbumWithMeta;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link href={`/albums/${album.id}`} className="group">
      <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
          {album.coverMediaId ? (
            <img
              src={`/api/thumbnail/${album.coverMediaId}`}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground/40" />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{album.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="size-3" />
              {album.mediaCount}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {album.memberCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
