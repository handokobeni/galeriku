export interface SearchResult {
  type: "media" | "album";
  id: string;
  title: string;
  albumId?: string;
  albumName?: string;
  mediaType?: "photo" | "video";
  thumbnailMediaId?: string;
}
