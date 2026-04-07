export type ActivityAction =
  | "login"
  | "login_failed"
  | "logout"
  | "user_invited"
  | "user_deactivated"
  | "album_created"
  | "album_deleted"
  | "media_uploaded"
  | "media_deleted"
  | "comment_created"
  | "member_added"
  | "member_removed"
  | "settings_changed";

export type EntityType = "user" | "album" | "media" | "comment" | "settings";

export interface ActivityLogEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
