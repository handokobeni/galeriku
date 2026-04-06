"use client";

import { useState, useCallback } from "react";
import {
  getFileExtension, isImageType, isVideoType, validateFileSize,
  generateImageThumbnail, generateVideoThumbnail,
} from "../services/thumbnail.client";
import { saveMediaAction } from "../actions/save-media";

type UploadStatus = "pending" | "generating-thumb" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  thumbnail?: Blob;
  r2Key?: string;
  thumbnailR2Key?: string;
}

export function useMediaUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((files: FileList) => {
    const newItems: UploadItem[] = Array.from(files)
      .filter((file) => {
        const valid = isImageType(file.type) || isVideoType(file.type);
        return valid && validateFileSize(file.type, file.size);
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending" as const,
        progress: 0,
      }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => { setItems([]); }, []);

  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const startUpload = useCallback(async (albumId: string) => {
    if (items.length === 0) return;
    setIsUploading(true);

    try {
      // Generate thumbnails
      const currentItems = [...items];
      for (const item of currentItems) {
        updateItem(item.id, { status: "generating-thumb" });
        try {
          const thumb = isImageType(item.file.type)
            ? await generateImageThumbnail(item.file)
            : await generateVideoThumbnail(item.file);
          updateItem(item.id, { thumbnail: thumb });
        } catch {
          updateItem(item.id, { status: "error", error: "Thumbnail failed" });
        }
      }

      // Request presigned URLs
      const filesToUpload = currentItems.filter((i) => i.status !== "error");
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId,
          files: filesToUpload.map((item) => ({
            id: item.id,
            filename: item.file.name,
            mimeType: item.file.type,
            size: item.file.size,
            ext: getFileExtension(item.file.name),
          })),
        }),
      });

      if (!presignResponse.ok) throw new Error("Presign failed");
      const { presignedUrls } = await presignResponse.json();

      // Upload with concurrency
      const CONCURRENCY = 3;
      const queue = [...presignedUrls];
      const uploadFile = async (presigned: {
        fileId: string;
        originalUrl: string;
        thumbnailUrl: string;
        originalKey: string;
        thumbnailKey: string;
      }) => {
        const item = currentItems.find((i) => i.id === presigned.fileId);
        if (!item) return;
        updateItem(presigned.fileId, { status: "uploading" });
        try {
          await fetch(presigned.originalUrl, { method: "PUT", body: item.file, headers: { "Content-Type": item.file.type } });
          if (item.thumbnail) {
            await fetch(presigned.thumbnailUrl, { method: "PUT", body: item.thumbnail, headers: { "Content-Type": "image/webp" } });
          }
          updateItem(presigned.fileId, { status: "done", progress: 100, r2Key: presigned.originalKey, thumbnailR2Key: presigned.thumbnailKey });
        } catch {
          updateItem(presigned.fileId, { status: "error", error: "Upload failed" });
        }
      };

      const workers = Array(Math.min(CONCURRENCY, queue.length)).fill(null).map(async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (item) await uploadFile(item);
        }
      });
      await Promise.all(workers);

      // Save metadata
      const successUrls = presignedUrls.filter((p: { fileId: string }) => {
        const item = currentItems.find((i) => i.id === p.fileId);
        return item && item.status !== "error";
      });

      if (successUrls.length > 0) {
        await saveMediaAction({
          albumId,
          items: successUrls.map((p: { fileId: string; originalKey: string; thumbnailKey: string }) => {
            const item = currentItems.find((i) => i.id === p.fileId)!;
            return {
              id: p.fileId,
              type: isVideoType(item.file.type) ? "video" as const : "photo" as const,
              filename: item.file.name,
              r2Key: p.originalKey,
              thumbnailR2Key: p.thumbnailKey,
              mimeType: item.file.type,
              sizeBytes: item.file.size,
              width: null,
              height: null,
              duration: null,
            };
          }),
        });
      }
    } finally {
      setIsUploading(false);
    }
  }, [items]);

  return { items, addFiles, startUpload, removeItem, clearAll, isUploading };
}
