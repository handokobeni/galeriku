import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAdminStats, getStorageByAlbum } from "@/features/admin/services/admin.service";
import { StorageBar } from "@/features/admin/components/storage-bar";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminStoragePage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const [stats, perAlbum] = await Promise.all([
    getAdminStats(),
    getStorageByAlbum(),
  ]);

  const sortedAlbums = [...perAlbum].sort(
    (a, b) => Number(b.storageBytes) - Number(a.storageBytes)
  );

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12">
        <p className="label-eyebrow mb-4">✦ 04 — Storage</p>
        <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground">
          R2 <em className="italic font-light text-primary">storage</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground italic">
          Bandwidth-free Cloudflare R2 — usage breakdown per album
        </p>
        <div className="divider-gold mt-8" />
      </header>

      <div className="space-y-10">
        <StorageBar used={stats.storageUsedBytes} limit={stats.storageLimitBytes} />

        <section>
          <p className="label-eyebrow mb-4">Per album</p>
          <div className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px] font-editorial">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">
                      Album
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">
                      Creator
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">
                      Media
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">
                      Storage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAlbums.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-border/60 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-display text-base">{a.name}</td>
                      <td className="px-5 py-3 text-muted-foreground italic">{a.creatorName}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs">{a.mediaCount}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs">
                        {formatBytes(Number(a.storageBytes))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
