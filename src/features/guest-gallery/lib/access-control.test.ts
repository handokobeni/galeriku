import { describe, expect, it } from "vitest";
import { canViewAlbum, canDownload, downloadVariantKey } from "./access-control";

const baseAlbum = {
  id: "a",
  isPublic: true,
  passwordHash: null as string | null,
  downloadPolicy: "none" as "none" | "watermarked" | "clean",
  expiresAt: null as Date | null,
};

describe("access-control", () => {
  describe("canViewAlbum", () => {
    it("allows public album with no expiry", () => {
      expect(canViewAlbum(baseAlbum)).toEqual({ ok: true });
    });
    it("blocks non-public as not-found", () => {
      expect(canViewAlbum({ ...baseAlbum, isPublic: false })).toEqual({ ok: false, reason: "not-found" });
    });
    it("blocks expired as gone", () => {
      expect(canViewAlbum({ ...baseAlbum, expiresAt: new Date(Date.now() - 1000) })).toEqual({ ok: false, reason: "expired" });
    });
    it("allows future expiry", () => {
      expect(canViewAlbum({ ...baseAlbum, expiresAt: new Date(Date.now() + 60_000) }).ok).toBe(true);
    });
  });

  describe("canDownload", () => {
    it("none → false", () => { expect(canDownload({ ...baseAlbum, downloadPolicy: "none" })).toBe(false); });
    it("watermarked → true", () => { expect(canDownload({ ...baseAlbum, downloadPolicy: "watermarked" })).toBe(true); });
    it("clean → true", () => { expect(canDownload({ ...baseAlbum, downloadPolicy: "clean" })).toBe(true); });
  });

  describe("downloadVariantKey", () => {
    it("watermarked → watermarkedFull", () => { expect(downloadVariantKey("watermarked")).toBe("watermarkedFull"); });
    it("clean → original", () => { expect(downloadVariantKey("clean")).toBe("original"); });
    it("none → null", () => { expect(downloadVariantKey("none")).toBeNull(); });
  });
});
