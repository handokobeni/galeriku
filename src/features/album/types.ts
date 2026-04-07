export type AlbumMemberRole = "viewer" | "editor";

/**
 * Display role includes "owner" — only used in the UI/getAlbumMembers
 * to indicate the album creator. The DB enum is still viewer/editor.
 */
export type AlbumMemberDisplayRole = "owner" | "editor" | "viewer";

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
  role: AlbumMemberDisplayRole;
  invitedAt: Date;
}
