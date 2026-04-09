type Entry = { count: number; resetAt: number };

export type RateLimiter = {
  /** Check whether `key` is allowed AND increment usage. Returns false if blocked. */
  check: (key: string) => boolean;
  /** Increment without checking — used to count failures explicitly. */
  hit: (key: string) => void;
  /** Check current state without incrementing. Returns false if blocked. */
  isAllowed: (key: string) => boolean;
  /** Clear the bucket for `key` (e.g. after successful auth). */
  reset: (key: string) => void;
};

export function createRateLimiter(opts: { limit: number; windowMs: number }): RateLimiter {
  const store = new Map<string, Entry>();

  function getEntry(key: string, now: number): Entry | null {
    const e = store.get(key);
    if (!e || e.resetAt <= now) return null;
    return e;
  }

  return {
    check(key: string): boolean {
      const now = Date.now();
      const e = getEntry(key, now);
      if (!e) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs });
        return true;
      }
      if (e.count >= opts.limit) return false;
      e.count++;
      return true;
    },
    isAllowed(key: string): boolean {
      const now = Date.now();
      const e = getEntry(key, now);
      if (!e) return true;
      return e.count < opts.limit;
    },
    hit(key: string): void {
      const now = Date.now();
      const e = getEntry(key, now);
      if (!e) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs });
        return;
      }
      e.count++;
    },
    reset(key: string): void {
      store.delete(key);
    },
  };
}

// Tuned for non-technical wedding clients on mobile (older relatives, typos
// on small keypads). Brute force is not the threat model here — passwords
// are 6+ char random shared via WhatsApp, billions of combinations. The
// limiter exists for spam/DoS protection, so values lean lenient.
export const unlockLimiter = createRateLimiter({ limit: 10, windowMs: 5 * 60_000 });
export const guestRegisterLimiter = createRateLimiter({ limit: 5, windowMs: 30 * 60_000 });
export const favoriteLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

// Studio auth limiters — tighter than guest gallery because the threat model
// includes credential brute force on owner/admin accounts and email
// enumeration on the forgot-password endpoint.
export const forgotPasswordLimiter = createRateLimiter({
  limit: 3,
  windowMs: 15 * 60_000,
});
