import Link from "next/link";
import { ImageIcon, FolderOpen, Search } from "lucide-react";
import type { SearchResult } from "../types";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="size-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No results for &quot;{query}&quot;</p>
      </div>
    );
  }

  const albums = results.filter((r) => r.type === "album");
  const mediaItems = results.filter((r) => r.type === "media");

  return (
    <div className="space-y-6">
      {albums.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Albums ({albums.length})</h3>
          <div className="space-y-1">
            {albums.map((album) => (
              <Link key={album.id} href={`/albums/${album.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <FolderOpen className="size-5 text-muted-foreground" />
                <span className="text-sm">{album.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mediaItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Media ({mediaItems.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
            {mediaItems.map((item) => (
              <Link key={item.id} href={`/media/${item.id}`} className="group">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
                  {item.thumbnailMediaId ? (
                    <img src={`/api/thumbnail/${item.thumbnailMediaId}`} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="size-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{item.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
