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
//
// Forgot-password: 1 attempt per 15 min per IP. Tight on purpose because
// the form returns "Email not found" for missing accounts (we kept the UX
// over always-success), so the rate limit is the primary defense against
// enumeration. 1/15min × 96 windows/day = 96 attempts/day per IP, vs ~73k
// at the previous 3/15min × 256-IP /24 — that earlier value was too lax.
export const forgotPasswordLimiter = createRateLimiter({
  limit: 1,
  windowMs: 15 * 60_000,
});

// Login attempts: 10 / 5 minutes per IP. Lenient enough for legit typos
// on first try, tight enough that brute forcing a strong password is
// infeasible (10/min × 60 × 24 = 14,400/day vs ~10^12 keyspace).
export const loginLimiter = createRateLimiter({
  limit: 10,
  windowMs: 5 * 60_000,
});

// Sign-up: 5 / 10 minutes per IP — stops automated account creation.
export const signupLimiter = createRateLimiter({
  limit: 5,
  windowMs: 10 * 60_000,
});
