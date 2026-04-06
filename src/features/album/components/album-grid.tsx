import { AlbumCard } from "./album-card";
import type { AlbumWithMeta } from "../types";

interface AlbumGridProps {
  albums: AlbumWithMeta[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </>
  );
}
