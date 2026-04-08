"use client";
import { useState } from "react";
import { FavoriteHeart } from "./favorite-heart";
import { Lightbox } from "./lightbox";

export type Photo = {
  id: string;
  thumbUrl: string;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

export function GalleryGrid({
  slug, photos, hasGuest, downloadPolicy, favorites,
}: {
  slug: string;
  photos: Photo[];
  hasGuest: boolean;
  downloadPolicy: "none" | "watermarked" | "clean";
  favorites: Set<string>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return <div className="py-20 text-center text-gray-500">Photographer belum upload foto.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={p.thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
              width={p.width ?? 400}
              height={p.height ?? 400}
              onClick={() => setOpenIndex(i)}
              className="h-full w-full object-cover cursor-pointer"
            />
            <div className="absolute bottom-1 right-1">
              <FavoriteHeart slug={slug} mediaId={p.id} hasGuest={hasGuest} initialFavorited={favorites.has(p.id)} />
            </div>
          </div>
        ))}
      </div>
      {openIndex !== null && (
        <Lightbox
          slug={slug}
          photos={photos}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          hasGuest={hasGuest}
          downloadPolicy={downloadPolicy}
          favorites={favorites}
        />
      )}
    </>
  );
}
