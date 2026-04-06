"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { addTagAction, removeTagAction } from "../actions/tag-actions";
import { TagBadge } from "./tag-badge";
import type { TagInfo } from "../types";

interface TagInputProps {
  mediaId: string;
  tags: TagInfo[];
  canEdit: boolean;
}

export function TagInput({ mediaId, tags, canEdit }: TagInputProps) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const handleAdd = async () => {
    if (!value.trim()) return;
    setPending(true);
    await addTagAction(mediaId, value.trim());
    setValue("");
    setPending(false);
  };

  const handleRemove = async (tagId: number) => {
    await removeTagAction(mediaId, tagId);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <TagBadge key={t.id} name={t.name} onRemove={canEdit ? () => handleRemove(t.id) : undefined} />
        ))}
      </div>
      {canEdit && (
        <div className="flex gap-1">
          <Input
            placeholder="Add tag..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            className="h-7 text-xs"
          />
          <button onClick={handleAdd} disabled={pending || !value.trim()} className="text-muted-foreground hover:text-primary disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
