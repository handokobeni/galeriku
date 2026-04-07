interface StorageBarProps {
  used: number;
  limit: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StorageBar({ used, limit }: StorageBarProps) {
  const pct = Math.min(100, (used / limit) * 100);
  const isWarning = pct > 80;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">R2 Storage</h3>
        <span className="text-xs text-muted-foreground">
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isWarning ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">{pct.toFixed(1)}% used</p>
    </div>
  );
}
