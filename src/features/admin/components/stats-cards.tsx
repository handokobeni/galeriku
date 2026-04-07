import { Users, FolderOpen, ImageIcon, HardDrive } from "lucide-react";
import type { AdminStats } from "../types";

interface StatsCardsProps {
  stats: AdminStats;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, sub: null },
    { icon: FolderOpen, label: "Total Albums", value: stats.totalAlbums, sub: null },
    {
      icon: ImageIcon,
      label: "Total Media",
      value: stats.totalMedia,
      sub: `${stats.totalPhotos} photos · ${stats.totalVideos} videos`,
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: formatBytes(stats.storageUsedBytes),
      sub: `of ${formatBytes(stats.storageLimitBytes)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <card.icon className="size-4" />
            <span className="text-xs uppercase tracking-wide">{card.label}</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{card.value}</div>
          {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
