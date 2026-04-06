const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_PHOTO_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

export function isVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

export function validateFileSize(mimeType: string, size: number): boolean {
  if (isImageType(mimeType)) return size <= MAX_PHOTO_SIZE;
  if (isVideoType(mimeType)) return size <= MAX_VIDEO_SIZE;
  return false;
}

export async function generateImageThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const maxSize = 400;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error("Failed")); },
        "image/webp", 0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load")); };
    img.src = url;
  });
}

export async function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration / 2); };
    video.onseeked = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const maxSize = 400;
      const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
      canvas.width = video.videoWidth * ratio;
      canvas.height = video.videoHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error("Failed")); },
        "image/webp", 0.8
      );
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed")); };
    video.preload = "metadata";
    video.src = url;
  });
}
