import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({ name, onRemove, className }: TagBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary", className)}>
      #{name}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-destructive">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
