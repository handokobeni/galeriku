import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllAlbumsForAdmin } from "@/features/admin/services/admin.service";
import { AlbumTable } from "@/features/admin/components/album-table";

export default async function AdminAlbumsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const albums = await getAllAlbumsForAdmin();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">All Albums</h1>
        <p className="text-sm text-muted-foreground">{albums.length} total albums</p>
      </div>
      <AlbumTable albums={albums} />
    </div>
  );
}
