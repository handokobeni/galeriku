import { describe, it, expect } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  describe("exact-match public routes", () => {
    it("/ is public", () => expect(isPublicPath("/")).toBe(true));
    it("/login is public", () => expect(isPublicPath("/login")).toBe(true));
    it("/register is public", () => expect(isPublicPath("/register")).toBe(true));
    it("/setup is public", () => expect(isPublicPath("/setup")).toBe(true));
    it("/forgot-password is public", () => expect(isPublicPath("/forgot-password")).toBe(true));
    it("/reset-password is public", () => expect(isPublicPath("/reset-password")).toBe(true));
  });

  describe("prefix bypass protection (the bug)", () => {
    it("/setupx is NOT public", () => expect(isPublicPath("/setupx")).toBe(false));
    it("/loginfoo is NOT public", () => expect(isPublicPath("/loginfoo")).toBe(false));
    it("/registerbypass is NOT public", () => expect(isPublicPath("/registerbypass")).toBe(false));
    it("/api/authority is NOT public", () => expect(isPublicPath("/api/authority")).toBe(false));
    it("/api/authentication is NOT public", () => expect(isPublicPath("/api/authentication")).toBe(false));
    it("/forgot-password-leak is NOT public", () => expect(isPublicPath("/forgot-password-leak")).toBe(false));
  });

  describe("legitimate sub-paths under public prefixes", () => {
    it("/api/auth/sign-in/email is public", () =>
      expect(isPublicPath("/api/auth/sign-in/email")).toBe(true));
    it("/api/auth/session is public", () => expect(isPublicPath("/api/auth/session")).toBe(true));
    it("/g/abc12-wedding is public (guest gallery)", () =>
      expect(isPublicPath("/g/abc12-wedding")).toBe(true));
    it("/g/abc12-wedding/api/unlock is public", () =>
      expect(isPublicPath("/g/abc12-wedding/api/unlock")).toBe(true));
  });

  describe("protected routes", () => {
    it("/albums is NOT public", () => expect(isPublicPath("/albums")).toBe(false));
    it("/albums/123 is NOT public", () => expect(isPublicPath("/albums/123")).toBe(false));
    it("/admin is NOT public", () => expect(isPublicPath("/admin")).toBe(false));
    it("/admin/users is NOT public", () => expect(isPublicPath("/admin/users")).toBe(false));
    it("/api/upload/presign is NOT public", () =>
      expect(isPublicPath("/api/upload/presign")).toBe(false));
  });

  describe("static assets at root", () => {
    it("/sw.js is public", () => expect(isPublicPath("/sw.js")).toBe(true));
    it("/manifest.json is public", () => expect(isPublicPath("/manifest.json")).toBe(true));
    it("/manifest.webmanifest is public", () =>
      expect(isPublicPath("/manifest.webmanifest")).toBe(true));
    it("/favicon.ico is public", () => expect(isPublicPath("/favicon.ico")).toBe(true));
    it("/icon-192.png is public", () => expect(isPublicPath("/icon-192.png")).toBe(true));
    it("/robots.txt is public", () => expect(isPublicPath("/robots.txt")).toBe(true));
  });

  describe("path traversal / odd inputs do not bypass", () => {
    it("/foo.js/../admin is NOT public (regex anchored)", () =>
      expect(isPublicPath("/foo.js/../admin")).toBe(false));
    it("/foo.js/admin is NOT public", () => expect(isPublicPath("/foo.js/admin")).toBe(false));
    it("empty string is NOT public", () => expect(isPublicPath("")).toBe(false));
    it("nested static path is NOT public", () =>
      expect(isPublicPath("/uploads/foo.png")).toBe(false));
  });
});
