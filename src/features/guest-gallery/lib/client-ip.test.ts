import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { getClientKey } from "./client-ip";

function makeReq(headers: Record<string, string>): Request {
  return new Request("http://localhost", { headers });
}

describe("getClientKey", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    warnSpy.mockRestore();
  });

  it("prefers cf-connecting-ip", () => {
    expect(
      getClientKey(
        makeReq({
          "cf-connecting-ip": "1.1.1.1",
          "x-real-ip": "2.2.2.2",
          "x-forwarded-for": "3.3.3.3",
        }),
      ),
    ).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip when no cf header", () => {
    expect(
      getClientKey(
        makeReq({
          "x-real-ip": "2.2.2.2",
          "x-forwarded-for": "3.3.3.3",
        }),
      ),
    ).toBe("2.2.2.2");
  });

  it("uses first IP in x-forwarded-for chain", () => {
    expect(
      getClientKey(
        makeReq({
          "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3",
        }),
      ),
    ).toBe("1.1.1.1");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    expect(
      getClientKey(
        makeReq({
          "x-forwarded-for": "  4.4.4.4  ",
        }),
      ),
    ).toBe("4.4.4.4");
  });

  it("returns 'local' in dev when no IP headers", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getClientKey(makeReq({}))).toBe("local");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns per-request random + warns in production when no IP headers", () => {
    vi.stubEnv("NODE_ENV", "production");
    const a = getClientKey(makeReq({}));
    const b = getClientKey(makeReq({}));
    expect(a).toMatch(/^noip-/);
    expect(b).toMatch(/^noip-/);
    expect(a).not.toBe(b); // different per request
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("ignores empty x-forwarded-for", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getClientKey(makeReq({ "x-forwarded-for": "" }))).toBe("local");
  });
});
