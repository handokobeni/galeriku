import Link from "next/link";
import { Play } from "lucide-react";
import type { MediaWithUploader } from "../types";

interface MediaCardProps {
  media: MediaWithUploader;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MediaCard({ media }: MediaCardProps) {
  return (
    <Link href={`/media/${media.id}`} className="group">
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
        <img
          src={`/api/thumbnail/${media.id}`}
          alt={media.filename}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        {media.type === "video" && media.duration != null && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] text-white font-medium">
            <Play className="size-2.5 fill-current" />
            {formatDuration(media.duration)}
          </div>
        )}
      </div>
    </Link>
  );
}
