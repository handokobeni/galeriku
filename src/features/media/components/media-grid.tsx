import { MediaCard } from "./media-card";
import type { MediaWithUploader } from "../types";

interface MediaGridProps {
  items: MediaWithUploader[];
}

export function MediaGrid({ items }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No media yet</p>
        <p className="text-xs mt-1">Upload photos or videos to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
      {items.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}
