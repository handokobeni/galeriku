"use client";

import { UserAvatar } from "@/shared/components/avatar";
import { CommentForm } from "./comment-form";
import type { CommentWithUser } from "../types";

interface CommentListProps {
  mediaId: string;
  comments: CommentWithUser[];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentList({ mediaId, comments }: CommentListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <UserAvatar name={c.userName} image={c.userImage} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.userName}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t p-3">
        <CommentForm mediaId={mediaId} />
      </div>
    </div>
  );
}
