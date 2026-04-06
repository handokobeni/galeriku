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

    // Use a local Map to store thumbnails (not React state — avoids stale snapshot issue)
    const thumbnailMap = new Map<string, Blob>();
    const errorIds = new Set<string>();

    try {
      // Step 1: Generate thumbnails
      const currentItems = [...items];
      for (const item of currentItems) {
        updateItem(item.id, { status: "generating-thumb" });
        try {
          const thumb = isImageType(item.file.type)
            ? await generateImageThumbnail(item.file)
            : await generateVideoThumbnail(item.file);
          thumbnailMap.set(item.id, thumb);
        } catch {
          errorIds.add(item.id);
          updateItem(item.id, { status: "error", error: "Thumbnail failed" });
        }
      }

      // Step 2: Request presigned URLs
      const filesToUpload = currentItems.filter((i) => !errorIds.has(i.id));
      if (filesToUpload.length === 0) return;

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

      // Step 3: Upload with concurrency
      const CONCURRENCY = 3;
      const queue = [...presignedUrls];
      const uploadedIds: string[] = [];

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
          // Upload original
          await fetch(presigned.originalUrl, {
            method: "PUT",
            body: item.file,
            headers: { "Content-Type": item.file.type },
          });

          // Upload thumbnail from local Map (not from stale React state)
          const thumbBlob = thumbnailMap.get(presigned.fileId);
          if (thumbBlob) {
            await fetch(presigned.thumbnailUrl, {
              method: "PUT",
              body: thumbBlob,
              headers: { "Content-Type": "image/webp" },
            });
          }

          uploadedIds.push(presigned.fileId);
          updateItem(presigned.fileId, {
            status: "done",
            progress: 100,
            r2Key: presigned.originalKey,
            thumbnailR2Key: presigned.thumbnailKey,
          });
        } catch {
          updateItem(presigned.fileId, { status: "error", error: "Upload failed" });
        }
      };

      const workers = Array(Math.min(CONCURRENCY, queue.length))
        .fill(null)
        .map(async () => {
          while (queue.length > 0) {
            const next = queue.shift();
            if (next) await uploadFile(next);
          }
        });
      await Promise.all(workers);

      // Step 4: Save metadata for successfully uploaded files
      if (uploadedIds.length > 0) {
        const successPresigned = presignedUrls.filter(
          (p: { fileId: string }) => uploadedIds.includes(p.fileId)
        );

        await saveMediaAction({
          albumId,
          items: successPresigned.map(
            (p: { fileId: string; originalKey: string; thumbnailKey: string }) => {
              const item = currentItems.find((i) => i.id === p.fileId)!;
              return {
                id: p.fileId,
                type: isVideoType(item.file.type) ? ("video" as const) : ("photo" as const),
                filename: item.file.name,
                r2Key: p.originalKey,
                thumbnailR2Key: p.thumbnailKey,
                mimeType: item.file.type,
                sizeBytes: item.file.size,
                width: null,
                height: null,
                duration: null,
              };
            }
          ),
        });
      }
    } finally {
      setIsUploading(false);
    }
  }, [items]);

  return { items, addFiles, startUpload, removeItem, clearAll, isUploading };
}
