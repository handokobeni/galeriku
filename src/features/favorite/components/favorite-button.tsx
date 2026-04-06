"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "../actions/favorite-actions";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  mediaId: string;
  initialFavorited: boolean;
  className?: string;
}

export function FavoriteButton({ mediaId, initialFavorited, className }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    setPending(true);
    setIsFavorited(!isFavorited); // Optimistic
    const result = await toggleFavoriteAction(mediaId);
    if (result.error) setIsFavorited(isFavorited); // Revert
    setPending(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-9", className)}
      onClick={handleToggle}
      disabled={pending}
      aria-label="Favorite"
      data-favorited={isFavorited}
    >
      <Heart className={cn("size-5 transition-colors", isFavorited ? "fill-red-500 text-red-500" : "text-current")} />
    </Button>
  );
}
