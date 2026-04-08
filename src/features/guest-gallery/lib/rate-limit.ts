type Entry = { count: number; resetAt: number };

export type RateLimiter = {
  check: (key: string) => boolean;
};

export function createRateLimiter(opts: { limit: number; windowMs: number }): RateLimiter {
  const store = new Map<string, Entry>();
  return {
    check(key: string): boolean {
      const now = Date.now();
      const e = store.get(key);
      if (!e || e.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs });
        return true;
      }
      if (e.count >= opts.limit) return false;
      e.count++;
      return true;
    },
  };
}

export const unlockLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });
export const guestRegisterLimiter = createRateLimiter({ limit: 3, windowMs: 60 * 60_000 });
export const favoriteLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
