export type AlbumMemberRole = "viewer" | "editor";

export interface AlbumWithMeta {
  id: string;
  name: string;
  description: string | null;
  coverMediaId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  mediaCount: number;
}

export interface AlbumMemberInfo {
  userId: string;
  userName: string;
  userEmail: string;
  role: AlbumMemberRole;
  invitedAt: Date;
}
