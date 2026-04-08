import { getAdminStats } from "@/features/admin/services/admin.service";
import { StatsCards } from "@/features/admin/components/stats-cards";
import { StorageBar } from "@/features/admin/components/storage-bar";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12">
        <p className="label-eyebrow mb-4">✦ 04 — Admin</p>
        <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground">
          System <em className="italic font-light text-primary">overview</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground italic">
          Monitor stats, storage and activity across your studio
        </p>
        <div className="divider-gold mt-8" />
      </header>

      <div className="space-y-8">
        <StatsCards stats={stats} />
        <StorageBar used={stats.storageUsedBytes} limit={stats.storageLimitBytes} />
      </div>
    </div>
  );
}
