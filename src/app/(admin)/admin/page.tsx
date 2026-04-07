import { getAdminStats } from "@/features/admin/services/admin.service";
import { StatsCards } from "@/features/admin/components/stats-cards";
import { StorageBar } from "@/features/admin/components/storage-bar";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">System statistics and storage usage</p>
      </div>
      <StatsCards stats={stats} />
      <StorageBar used={stats.storageUsedBytes} limit={stats.storageLimitBytes} />
    </div>
  );
}
