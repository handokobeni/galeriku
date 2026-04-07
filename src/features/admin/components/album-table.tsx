"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteAlbumAction } from "@/features/album/actions/delete-album";
import type { AlbumStat } from "../types";

interface AlbumTableProps {
  albums: AlbumStat[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AlbumTable({ albums }: AlbumTableProps) {
  const handleDelete = async (albumId: string) => {
    if (!confirm("Delete this album and all its media?")) return;
    await deleteAlbumAction(albumId);
  };

  return (
    <>
      {/* Mobile: card stack */}
      <div className="lg:hidden space-y-2">
        {albums.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/albums/${a.id}`}
                  className="font-medium hover:underline truncate block"
                >
                  {a.name}
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  by {a.creatorName}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-muted-foreground hover:text-destructive p-1 flex-shrink-0"
                aria-label="Delete album"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{a.mediaCount} items</span>
              <span>{a.memberCount} members</span>
              <span className="ml-auto font-medium">
                {formatBytes(Number(a.storageBytes))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Album</th>
              <th className="text-left px-4 py-3 font-medium">Creator</th>
              <th className="text-right px-4 py-3 font-medium">Media</th>
              <th className="text-right px-4 py-3 font-medium">Members</th>
              <th className="text-right px-4 py-3 font-medium">Storage</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {albums.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link href={`/albums/${a.id}`} className="font-medium hover:underline">
                    {a.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.creatorName}</td>
                <td className="px-4 py-3 text-right">{a.mediaCount}</td>
                <td className="px-4 py-3 text-right">{a.memberCount}</td>
                <td className="px-4 py-3 text-right">
                  {formatBytes(Number(a.storageBytes))}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete album"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
