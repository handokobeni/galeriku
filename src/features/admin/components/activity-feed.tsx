import {
  LogIn,
  LogOut,
  AlertCircle,
  UserPlus,
  UserMinus,
  FolderPlus,
  FolderMinus,
  Upload,
  Trash2,
  MessageSquare,
  Settings,
  Activity as ActivityIcon,
} from "lucide-react";
import type { ActivityLogEntry } from "@/features/activity/types";
import type { LucideIcon } from "lucide-react";

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
}

const iconMap: Record<string, LucideIcon> = {
  login: LogIn,
  login_failed: AlertCircle,
  logout: LogOut,
  user_invited: UserPlus,
  user_deactivated: UserMinus,
  album_created: FolderPlus,
  album_deleted: FolderMinus,
  media_uploaded: Upload,
  media_deleted: Trash2,
  comment_created: MessageSquare,
  member_added: UserPlus,
  member_removed: UserMinus,
  settings_changed: Settings,
};

const colorMap: Record<string, string> = {
  login: "text-blue-500",
  login_failed: "text-destructive",
  logout: "text-muted-foreground",
  album_created: "text-green-500",
  album_deleted: "text-destructive",
  media_uploaded: "text-green-500",
  media_deleted: "text-destructive",
};

function describeAction(entry: ActivityLogEntry): string {
  const meta = entry.metadata ?? {};
  switch (entry.action) {
    case "login":
      return "logged in";
    case "logout":
      return "logged out";
    case "login_failed":
      return "failed login attempt";
    case "album_created":
      return `created album "${(meta as { name?: string }).name ?? ""}"`;
    case "album_deleted":
      return `deleted album "${(meta as { name?: string }).name ?? ""}"`;
    case "media_uploaded":
      return `uploaded ${(meta as { count?: number }).count ?? 0} item(s)`;
    case "media_deleted":
      return `deleted ${(meta as { filename?: string }).filename ?? "media"}`;
    case "comment_created":
      return "added a comment";
    case "user_invited":
      return `invited user ${(meta as { email?: string }).email ?? ""}`;
    case "user_deactivated":
      return "removed a user";
    case "member_added":
      return "added a member to album";
    case "member_removed":
      return "removed a member from album";
    case "settings_changed":
      return "updated settings";
    default:
      return entry.action;
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ActivityIcon className="size-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {activities.map((entry) => {
        const Icon = iconMap[entry.action] ?? ActivityIcon;
        const color = colorMap[entry.action] ?? "text-muted-foreground";
        return (
          <div key={entry.id} className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{entry.userName ?? "Unknown"}</span>{" "}
                <span className="text-muted-foreground">{describeAction(entry)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {timeAgo(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
