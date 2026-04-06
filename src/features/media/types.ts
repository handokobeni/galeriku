export type MediaType = "photo" | "video";

export interface MediaItem {
  id: string;
  albumId: string;
  uploadedBy: string;
  type: MediaType;
  filename: string;
  r2Key: string;
  thumbnailR2Key: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: Date;
}

export interface MediaWithUploader extends MediaItem {
  uploaderName: string;
}
