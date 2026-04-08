import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to limit then blocks", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(false);
  });

  it("resets after window", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(rl.check("k")).toBe(true);
  });

  it("isolates keys", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("a")).toBe(true);
    expect(rl.check("b")).toBe(true);
    expect(rl.check("a")).toBe(false);
  });
});
