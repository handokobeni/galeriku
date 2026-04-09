/**
 * Resolve a stable per-client identifier for rate limiting.
 *
 * Order of preference (most → least trusted):
 *  1. cf-connecting-ip   (Cloudflare)
 *  2. x-real-ip          (Nginx, generic reverse proxies)
 *  3. x-forwarded-for    (first hop only — split + trim)
 *
 * In production, if NONE of these resolve to a non-empty value, that means
 * the proxy in front of us is misconfigured and every request would collapse
 * into a single rate-limit bucket. We log a loud warning so it surfaces in
 * server logs, and use a safe but very granular fallback (random per request)
 * which effectively disables rate limiting for that one request rather than
 * letting one attacker DoS everyone else.
 *
 * In dev / test, we fall back to "local" so dev requests share a bucket and
 * the limiter behavior remains testable.
 */
export function getClientKey(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  if (process.env.NODE_ENV === "production") {
    // Prod proxy misconfiguration — loud warning, granular fallback
    console.warn(
      "[guest-gallery] WARNING: no client IP header present in production. " +
        "Check reverse proxy / Vercel headers configuration. " +
        "Falling back to per-request random key (rate limit disabled for this request).",
    );
    // Per-request random — effectively disables rate limit but doesn't
    // let an attacker poison the shared bucket.
    return `noip-${crypto.randomUUID()}`;
  }

  return "local";
}
