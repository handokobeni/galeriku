/**
 * Resolve a stable per-client identifier for rate limiting.
 *
 * THREAT MODEL: HTTP IP headers are user-controllable. An attacker who
 * sets `cf-connecting-ip: 1.2.3.4` rotating values can completely bypass
 * every rate limiter unless we restrict which header sources we trust.
 *
 * Trust model is configured by the deployment target:
 *
 *  • Vercel (default): only `x-forwarded-for` is trusted, and only the
 *    LEFTMOST entry — Vercel's edge always overwrites/adds this header
 *    so the leftmost entry is the real client. Any user-controlled
 *    `cf-connecting-ip` / `x-real-ip` is ignored.
 *
 *  • Cloudflare (TRUST_CF_HEADER=1): trust `cf-connecting-ip` first.
 *    Only enable when actually behind Cloudflare — otherwise spoofable.
 *
 *  • Other reverse proxies (TRUST_XREALIP=1): trust `x-real-ip`. Only
 *    enable when actually behind nginx / similar that overwrites it.
 *
 * If NONE of these are trusted/present in production, log a loud warning
 * and fall back to a per-request random key — disables rate limiting for
 * that one request but doesn't let an attacker poison shared buckets.
 *
 * In dev / test, fall back to "local" so dev requests share a bucket and
 * the limiter behavior remains testable.
 */

const TRUST_CF = process.env.TRUST_CF_HEADER === "1";
const TRUST_XREALIP = process.env.TRUST_XREALIP === "1";

function isLocalhost(req: Request): boolean {
  try {
    const host = new URL(req.url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function getClientKey(req: Request): string {
  if (TRUST_CF) {
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp;
  }

  if (TRUST_XREALIP) {
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }

  // x-forwarded-for: trust only when running on a known platform that
  // overwrites the leftmost entry (Vercel does this). On Vercel, VERCEL=1
  // is set automatically by the build environment.
  const onVercel = !!process.env.VERCEL;
  if (onVercel || TRUST_CF || TRUST_XREALIP) {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  // Local production testing (pnpm build && pnpm start on localhost):
  // there is no IP header but we still want a stable bucket so the
  // limiter is observable. Treat localhost as "local" identity.
  if (isLocalhost(req)) {
    return "local";
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[client-ip] WARNING: no trusted IP header in production. Set " +
        "TRUST_CF_HEADER=1 (Cloudflare), TRUST_XREALIP=1 (nginx), or run on " +
        "Vercel (auto-detected). Falling back to per-request random key — " +
        "rate limit disabled for this request.",
    );
    return `noip-${crypto.randomUUID()}`;
  }

  return "local";
}
