export type AlbumGate = {
  id: string;
  isPublic: boolean;
  passwordHash: string | null;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: Date | null;
};

export type ViewResult = { ok: true } | { ok: false; reason: "not-found" | "expired" };

export function canViewAlbum(album: AlbumGate): ViewResult {
  if (!album.isPublic) return { ok: false, reason: "not-found" };
  if (album.expiresAt && album.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true };
}

export function canDownload(album: AlbumGate): boolean {
  return album.downloadPolicy !== "none";
}

export function downloadVariantKey(
  policy: AlbumGate["downloadPolicy"],
): "watermarkedFull" | "original" | null {
  if (policy === "none") return null;
  if (policy === "watermarked") return "watermarkedFull";
  return "original";
}
