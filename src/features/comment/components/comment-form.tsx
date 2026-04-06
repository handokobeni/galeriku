"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { addCommentAction } from "../actions/comment-actions";

interface CommentFormProps {
  mediaId: string;
}

export function CommentForm({ mediaId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    await addCommentAction(mediaId, content.trim());
    setContent("");
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 text-sm"
      />
      <Button type="submit" size="icon" disabled={pending || !content.trim()} className="shrink-0">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
