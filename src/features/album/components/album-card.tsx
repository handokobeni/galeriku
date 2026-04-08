import Link from "next/link";
import { ImageIcon, Users, ArrowUpRight } from "lucide-react";
import type { AlbumWithMeta } from "../types";

interface AlbumCardProps {
  album: AlbumWithMeta;
  index?: number;
}

export function AlbumCard({ album, index }: AlbumCardProps) {
  const num = typeof index === "number" ? String(index + 1).padStart(2, "0") : null;

  return (
    <Link
      href={`/albums/${album.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
    >
      <article className="relative">
        {/* Cover */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {album.coverMediaId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/thumbnail/${album.coverMediaId}`}
              alt={album.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <ImageIcon className="size-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Gradient overlay for legibility on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Index number — top-left, mono */}
          {num && (
            <span className="absolute top-3 left-3 font-mono text-[10px] tracking-wider text-white/90 mix-blend-difference">
              ✦ {num}
            </span>
          )}

          {/* Hover arrow — top-right */}
          <div className="absolute top-3 right-3 size-7 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <ArrowUpRight className="size-3.5 text-foreground" strokeWidth={2.2} />
          </div>
        </div>

        {/* Caption — editorial style */}
        <div className="pt-4 pb-2 px-1">
          <h3 className="font-display text-xl leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
            {album.name}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-editorial text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="size-3" strokeWidth={1.5} />
              <span className="font-mono">{album.mediaCount}</span>
              <span className="italic">photo{album.mediaCount === 1 ? "" : "s"}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" strokeWidth={1.5} />
              <span className="font-mono">{album.memberCount}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
