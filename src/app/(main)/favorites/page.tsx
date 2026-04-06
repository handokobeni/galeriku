import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFavoritesForUser } from "@/features/favorite/services/favorite.service";
import { Heart } from "lucide-react";
import Link from "next/link";

export default async function FavoritesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const favorites = await getFavoritesForUser(session.user.id, userRole);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">
          {favorites.length} favorited item{favorites.length !== 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="size-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No favorites yet</p>
          <p className="text-xs mt-1">Tap the heart icon on any photo or video</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
          {favorites.map((fav) => (
            <Link key={fav.mediaId} href={`/media/${fav.mediaId}`} className="group">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
                <img
                  src={`/api/thumbnail/${fav.mediaId}`}
                  alt={fav.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
