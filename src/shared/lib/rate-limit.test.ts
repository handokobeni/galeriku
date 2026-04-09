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

  it("isAllowed checks without incrementing", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000 });
    expect(rl.isAllowed("k")).toBe(true);
    expect(rl.isAllowed("k")).toBe(true); // still no count
    rl.check("k");
    rl.check("k");
    expect(rl.isAllowed("k")).toBe(false);
  });

  it("hit increments without checking", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000 });
    rl.hit("k");
    rl.hit("k");
    expect(rl.isAllowed("k")).toBe(false);
    expect(rl.check("k")).toBe(false);
  });

  it("reset clears the bucket", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000 });
    rl.hit("k");
    rl.hit("k");
    expect(rl.isAllowed("k")).toBe(false);
    rl.reset("k");
    expect(rl.isAllowed("k")).toBe(true);
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(false);
  });

  it("hit on a fresh key initializes the bucket", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
    rl.hit("fresh");
    // Now allowed once more (count went from 0 → 1, limit is 3)
    expect(rl.check("fresh")).toBe(true);
    expect(rl.check("fresh")).toBe(true);
    expect(rl.check("fresh")).toBe(false);
  });
});
