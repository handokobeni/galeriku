"use client";
import { useEffect, useRef, useState } from "react";
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
  slug, initialPhotos, initialCursor, hasMore: initialHasMore,
  hasGuest, downloadPolicy, favorites,
}: {
  slug: string;
  initialPhotos: Photo[];
  initialCursor: string | null;
  hasMore: boolean;
  hasGuest: boolean;
  downloadPolicy: "none" | "watermarked" | "clean";
  favorites: Set<string>;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || !hasMore) return;
        setLoading(true);
        try {
          const params = new URLSearchParams({ limit: "60" });
          if (cursor) params.set("cursor", cursor);
          const res = await fetch(`/g/${slug}/api/media?${params.toString()}`);
          if (!res.ok) {
            setHasMore(false);
            return;
          }
          const data = (await res.json()) as { items: Photo[]; nextCursor: string | null; hasMore: boolean };
          setPhotos((prev) => [...prev, ...data.items]);
          setCursor(data.nextCursor);
          setHasMore(data.hasMore);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, slug]);

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
      {hasMore && (
        <div ref={sentinelRef} className="py-10 text-center text-xs text-gray-500">
          {loading ? "Loading more..." : ""}
        </div>
      )}
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
