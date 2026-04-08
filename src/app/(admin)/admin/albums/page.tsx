import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllAlbumsForAdmin } from "@/features/admin/services/admin.service";
import { AlbumTable } from "@/features/admin/components/album-table";

export default async function AdminAlbumsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const albums = await getAllAlbumsForAdmin();

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12">
        <p className="label-eyebrow mb-4">✦ 03 — Albums</p>
        <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground">
          All <em className="italic font-light text-primary">collections</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{albums.length}</span>{" "}
          <span className="italic">{albums.length === 1 ? "album" : "albums"} across the studio</span>
        </p>
        <div className="divider-gold mt-8" />
      </header>

      <AlbumTable albums={albums} />
    </div>
  );
}
