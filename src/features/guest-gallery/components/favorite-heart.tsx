"use client";
import { useState } from "react";
import { NameModal } from "./name-modal";

export function FavoriteHeart({
  slug, mediaId, hasGuest: initialHasGuest, initialFavorited = false,
}: { slug: string; mediaId: string; hasGuest: boolean; initialFavorited?: boolean }) {
  const [hasGuest, setHasGuest] = useState(initialHasGuest);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [showModal, setShowModal] = useState(false);

  async function toggle() {
    if (!hasGuest) {
      setShowModal(true);
      return;
    }
    const next = !favorited;
    setFavorited(next);
    const res = await fetch(`/g/${slug}/api/favorite`, {
      method: next ? "POST" : "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    if (!res.ok) setFavorited(!next);
  }

  function onGuestRegistered() {
    setHasGuest(true);
    setShowModal(false);
    void (async () => {
      setFavorited(true);
      const res = await fetch(`/g/${slug}/api/favorite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) setFavorited(false);
    })();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Favorite"
        onClick={toggle}
        className={`p-2 rounded-full ${favorited ? "text-red-500" : "text-white/80"}`}
      >
        {favorited ? "\u2665" : "\u2661"}
      </button>
      <NameModal
        slug={slug}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onGuestRegistered}
      />
    </>
  );
}
