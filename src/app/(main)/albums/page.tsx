import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAlbumsForUser } from "@/features/album/services/album.service";
import { AlbumCard } from "@/features/album/components/album-card";
import { CreateAlbumDialog } from "@/features/album/components/create-album-dialog";

export default async function AlbumsPage() {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const albums = await getAlbumsForUser(session.user.id, userRole);

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      {/* Editorial header */}
      <header className="mb-12 lg:mb-16">
        <p className="label-eyebrow mb-4">✦ 01 — Workspace</p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] text-foreground">
              Your <em className="italic font-light text-primary">albums</em>
            </h1>
            <p className="mt-4 font-editorial text-sm text-muted-foreground max-w-md">
              <span className="font-mono text-foreground">{albums.length}</span>{" "}
              {albums.length === 1 ? "collection" : "collections"} ·{" "}
              <span className="italic">curated by {session.user.name}</span>
            </p>
          </div>
        </div>
        <div className="divider-gold mt-8" />
      </header>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 lg:gap-x-10 lg:gap-y-16">
        {albums.map((album, i) => (
          <AlbumCard key={album.id} album={album} index={i} />
        ))}
        <CreateAlbumDialog />
      </div>
    </div>
  );
}
