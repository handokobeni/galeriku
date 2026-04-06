"use client";

import { useRouter } from "next/navigation";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./video-player";
import type { MediaWithUploader } from "../types";

interface MediaViewerProps {
  media: MediaWithUploader;
  viewUrl: string;
  downloadUrl?: string;
}

export function MediaViewer({ media, viewUrl, downloadUrl }: MediaViewerProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-white hover:bg-white/10"
          onClick={() => router.back()}
          aria-label="Close"
        >
          <X className="size-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-white hover:bg-white/10"
            onClick={() => downloadUrl && window.open(downloadUrl, "_blank")}
            aria-label="Download"
          >
            <Download className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {media.type === "video" ? (
          <VideoPlayer src={viewUrl} className="max-w-full max-h-full rounded-lg" />
        ) : (
          <img src={viewUrl} alt={media.filename} className="max-w-full max-h-full object-contain" />
        )}
      </div>

      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0">
        <p className="text-white text-sm font-medium">{media.filename}</p>
        <p className="text-white/60 text-xs mt-0.5">
          by {media.uploaderName} •{" "}
          {media.width && media.height && `${media.width}×${media.height} • `}
          {(media.sizeBytes / (1024 * 1024)).toFixed(1)} MB
        </p>
      </div>
    </div>
  );
}
