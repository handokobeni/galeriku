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
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Albums</h1>
          <p className="text-sm text-muted-foreground">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
        <CreateAlbumDialog />
      </div>
    </div>
  );
}
