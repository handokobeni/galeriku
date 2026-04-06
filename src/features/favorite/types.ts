export interface FavoriteMedia {
  mediaId: string;
  albumId: string;
  type: "photo" | "video";
  filename: string;
  thumbnailR2Key: string;
  duration: number | null;
  favoritedAt: Date;
}
