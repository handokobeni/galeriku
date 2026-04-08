"use client";
import { useEffect, useRef, useState } from "react";
import { FavoriteHeart } from "./favorite-heart";
import type { Photo } from "./gallery-grid";

export function Lightbox({
  slug, photos, startIndex, onClose, hasGuest, downloadPolicy, favorites,
}: {
  slug: string;
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
  hasGuest: boolean;
  downloadPolicy: "none" | "watermarked" | "clean";
  favorites: Set<string>;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(photos.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  const touchStartX = useRef(0);
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setIndex((i) => Math.max(0, i - 1));
    else if (dx < -50) setIndex((i) => Math.min(photos.length - 1, i + 1));
  }

  const current = photos[index];
  const canDownload = downloadPolicy !== "none";

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white text-2xl" aria-label="Close">×</button>
      <div className="flex-1 flex items-center justify-center">
        <img src={current.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex justify-center gap-6 py-4 text-white">
        <FavoriteHeart slug={slug} mediaId={current.id} hasGuest={hasGuest} initialFavorited={favorites.has(current.id)} />
        {canDownload && (
          <a
            href={`/g/${slug}/api/download/${current.id}`}
            download
            role="button"
            aria-label="Download"
            className="px-3 py-2 rounded border border-white/40"
          >
            ⬇ Download
          </a>
        )}
      </div>
    </div>
  );
}
