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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
        <p className="text-sm text-muted-foreground">R2 storage usage breakdown</p>
      </div>

      <StorageBar used={stats.storageUsedBytes} limit={stats.storageLimitBytes} />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Per Album</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Album</th>
              <th className="text-left px-4 py-2 font-medium">Creator</th>
              <th className="text-right px-4 py-2 font-medium">Media</th>
              <th className="text-right px-4 py-2 font-medium">Storage</th>
            </tr>
          </thead>
          <tbody>
            {sortedAlbums.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-2">{a.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{a.creatorName}</td>
                <td className="px-4 py-2 text-right">{a.mediaCount}</td>
                <td className="px-4 py-2 text-right">{formatBytes(Number(a.storageBytes))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
