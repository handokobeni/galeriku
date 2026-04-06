import { describe, it, expect } from "vitest";
import { getFileExtension, isImageType, isVideoType, validateFileSize } from "../thumbnail.client";

describe("thumbnail.client utilities", () => {
  it("gets file extension from filename", () => {
    expect(getFileExtension("photo.jpg")).toBe("jpg");
    expect(getFileExtension("video.mp4")).toBe("mp4");
    expect(getFileExtension("file.name.png")).toBe("png");
  });
  it("identifies image types", () => {
    expect(isImageType("image/jpeg")).toBe(true);
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("video/mp4")).toBe(false);
  });
  it("identifies video types", () => {
    expect(isVideoType("video/mp4")).toBe(true);
    expect(isVideoType("video/webm")).toBe(true);
    expect(isVideoType("image/jpeg")).toBe(false);
  });
  it("validates file size", () => {
    expect(validateFileSize("image/jpeg", 10 * 1024 * 1024)).toBe(true);
    expect(validateFileSize("image/jpeg", 25 * 1024 * 1024)).toBe(false);
    expect(validateFileSize("video/mp4", 100 * 1024 * 1024)).toBe(true);
    expect(validateFileSize("video/mp4", 600 * 1024 * 1024)).toBe(false);
  });
});
