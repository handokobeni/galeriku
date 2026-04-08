import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getFavoritesForUser } from "@/features/favorite/services/favorite.service";
import { Heart } from "lucide-react";
import Link from "next/link";

export default async function FavoritesPage() {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const favorites = await getFavoritesForUser(session.user.id, userRole);

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12 lg:mb-16">
        <p className="label-eyebrow mb-4">✦ 02 — Favorites</p>
        <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] text-foreground">
          Your <em className="italic font-light text-primary">picks</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{favorites.length}</span>{" "}
          <span className="italic">{favorites.length === 1 ? "item" : "items"} hand-selected</span>
        </p>
        <div className="divider-gold mt-8" />
      </header>

      {favorites.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-flex flex-col items-center gap-4">
            <Heart className="size-12 text-muted-foreground/30" strokeWidth={1.2} />
            <div>
              <p className="font-display text-2xl italic text-foreground">No favorites yet</p>
              <p className="mt-2 font-editorial text-xs text-muted-foreground">
                Tap the heart icon on any photo to save it here
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {favorites.map((fav) => (
            <Link
              key={fav.mediaId}
              href={`/media/${fav.mediaId}`}
              className="group relative aspect-square overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/thumbnail/${fav.mediaId}`}
                alt={fav.filename}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
