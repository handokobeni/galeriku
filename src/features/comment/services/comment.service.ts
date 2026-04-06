import { db } from "@/db";
import { comment } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getCommentsForMedia(mediaId: string) {
  return db
    .select({
      id: comment.id,
      mediaId: comment.mediaId,
      userId: comment.userId,
      userName: user.name,
      userImage: user.image,
      content: comment.content,
      createdAt: comment.createdAt,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(eq(comment.mediaId, mediaId))
    .orderBy(asc(comment.createdAt));
}

export async function addComment(mediaId: string, userId: string, content: string) {
  const [newComment] = await db
    .insert(comment)
    .values({ mediaId, userId, content })
    .returning();
  return newComment;
}

export async function deleteComment(commentId: string) {
  await db.delete(comment).where(eq(comment.id, commentId));
}

export async function getCommentCount(mediaId: string) {
  const result = await db
    .select({ id: comment.id })
    .from(comment)
    .where(eq(comment.mediaId, mediaId));
  return result.length;
}
