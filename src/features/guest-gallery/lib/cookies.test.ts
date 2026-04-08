import { describe, expect, it } from "vitest";
import { signCookie, verifyCookie } from "./cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("cookies", () => {
  it("signs and verifies a payload roundtrip", async () => {
    const token = await signCookie({ albumId: "abc", exp: Date.now() + 60_000 }, SECRET);
    const payload = await verifyCookie<{ albumId: string; exp: number }>(token, SECRET);
    expect(payload?.albumId).toBe("abc");
  });

  it("returns null for tampered token", async () => {
    const token = await signCookie({ x: 1 }, SECRET);
    const tampered = token.slice(0, -2) + "ZZ";
    expect(await verifyCookie(tampered, SECRET)).toBeNull();
  });

  it("returns null for expired payload", async () => {
    const token = await signCookie({ exp: Date.now() - 1000 }, SECRET);
    expect(await verifyCookie(token, SECRET)).toBeNull();
  });

  it("returns null for wrong secret", async () => {
    const token = await signCookie({ x: 1 }, SECRET);
    expect(await verifyCookie(token, "different-secret-32bytes-1234567")).toBeNull();
  });

  it("returns null for malformed token", async () => {
    expect(await verifyCookie("garbage", SECRET)).toBeNull();
    expect(await verifyCookie("", SECRET)).toBeNull();
  });
});
