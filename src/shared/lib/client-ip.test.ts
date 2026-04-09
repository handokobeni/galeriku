import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

function makeReq(headers: Record<string, string>): Request {
  return new Request("http://localhost", { headers });
}

// Re-import the module fresh after env stubs because TRUST_CF_HEADER and
// TRUST_XREALIP are read at module load time.
async function loadClientIp() {
  vi.resetModules();
  return (await import("./client-ip")).getClientKey;
}

describe("getClientKey — header trust model", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    warnSpy.mockRestore();
    vi.resetModules();
  });

  describe("default (dev, no trust env, not on Vercel)", () => {
    it("ignores spoofed cf-connecting-ip", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "cf-connecting-ip": "9.9.9.9" });
      expect(getClientKey(r)).toBe("local");
    });

    it("ignores spoofed x-real-ip", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "x-real-ip": "9.9.9.9" });
      expect(getClientKey(r)).toBe("local");
    });

    it("ignores spoofed x-forwarded-for", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "x-forwarded-for": "9.9.9.9" });
      expect(getClientKey(r)).toBe("local");
    });
  });

  describe("Vercel deployment (VERCEL=1)", () => {
    it("trusts the leftmost x-forwarded-for entry", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("VERCEL", "1");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3" });
      expect(getClientKey(r)).toBe("1.1.1.1");
    });

    it("does NOT trust spoofed cf-connecting-ip on Vercel", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("VERCEL", "1");
      const getClientKey = await loadClientIp();
      // Test makes requests to http://localhost which is detected as local
      // → returns "local" (stable bucket for local prod testing).
      // The key point: cf-connecting-ip is NOT returned.
      const r = makeReq({ "cf-connecting-ip": "9.9.9.9" });
      const key = getClientKey(r);
      expect(key).not.toBe("9.9.9.9");
    });
  });

  describe("Cloudflare deployment (TRUST_CF_HEADER=1)", () => {
    it("trusts cf-connecting-ip when explicitly enabled", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("TRUST_CF_HEADER", "1");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "cf-connecting-ip": "1.1.1.1" });
      expect(getClientKey(r)).toBe("1.1.1.1");
    });

    it("falls back to xff when cf header missing under TRUST_CF_HEADER", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("TRUST_CF_HEADER", "1");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "x-forwarded-for": "5.5.5.5" });
      expect(getClientKey(r)).toBe("5.5.5.5");
    });
  });

  describe("nginx deployment (TRUST_XREALIP=1)", () => {
    it("trusts x-real-ip when explicitly enabled", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("TRUST_XREALIP", "1");
      const getClientKey = await loadClientIp();
      const r = makeReq({ "x-real-ip": "2.2.2.2" });
      expect(getClientKey(r)).toBe("2.2.2.2");
    });
  });

  describe("localhost production testing", () => {
    it("returns 'local' for localhost even in production mode", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const getClientKey = await loadClientIp();
      // makeReq uses http://localhost — should be detected as local
      const key = getClientKey(makeReq({}));
      expect(key).toBe("local");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("production fallback when nothing is trusted (non-localhost)", () => {
    it("returns per-request random + warns for non-localhost prod", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const getClientKey = await loadClientIp();
      // Use a non-localhost URL to trigger the real production fallback
      const r = new Request("https://galeriku.example.com/api/auth/sign-in/email");
      const a = getClientKey(r);
      const b = getClientKey(r);
      expect(a).toMatch(/^noip-/);
      expect(b).toMatch(/^noip-/);
      expect(a).not.toBe(b);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });
});
