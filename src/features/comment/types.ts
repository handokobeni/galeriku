export interface CommentWithUser {
  id: string;
  mediaId: string;
  userId: string;
  userName: string;
  userImage: string | null;
  content: string;
  createdAt: Date;
}
