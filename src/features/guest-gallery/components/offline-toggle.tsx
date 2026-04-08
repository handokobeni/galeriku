"use client";
import { useState } from "react";

export function OfflineToggle({ slug, albumId }: { slug: string; albumId: string }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);

  async function fetchAllPreviewUrls(): Promise<string[]> {
    const all: string[] = [];
    let cursor: string | null = null;
    while (true) {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/g/${slug}/api/media?${params.toString()}`);
      if (!res.ok) break;
      const data = (await res.json()) as {
        items: { previewUrl: string }[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      for (const it of data.items) all.push(it.previewUrl);
      if (!data.hasMore) break;
      cursor = data.nextCursor;
    }
    return all;
  }

  async function saveOffline() {
    if (typeof caches === "undefined") return;
    const urls = await fetchAllPreviewUrls();
    const cache = await caches.open(`gallery-album-${albumId}-v1`);
    setProgress({ done: 0, total: urls.length });
    let i = 0;
    for (const url of urls) {
      try { await cache.add(url); } catch {}
      i++;
      setProgress({ done: i, total: urls.length });
    }
    setDone(true);
  }

  if (done) return <button disabled className="text-sm text-green-700">Saved offline ✓</button>;
  return (
    <button onClick={saveOffline} className="text-sm rounded-md border px-3 py-1">
      {progress === null ? "Save offline" : `Caching ${progress.done}/${progress.total}...`}
    </button>
  );
}
