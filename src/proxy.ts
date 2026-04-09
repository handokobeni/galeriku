import { NextRequest, NextResponse } from "next/server";
import { loginLimiter, signupLimiter, type RateLimiter } from "@/shared/lib/rate-limit";
import { getClientKey } from "@/shared/lib/client-ip";
import { isPublicPath } from "@/shared/lib/public-paths";

const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN ?? "";
// Specific R2 bucket host (narrow CSP for connect-src — img/media still
// use the wildcard because R2 image hosts vary by bucket+account).
const R2_BUCKET_HOST = process.env.R2_BUCKET_HOST ?? "";

// Auth endpoints rate-limited at the edge before reaching Better Auth.
const RATE_LIMITED_AUTH_ROUTES: Record<string, RateLimiter> = {
  "/api/auth/sign-in/email": loginLimiter,
  "/api/auth/sign-up/email": signupLimiter,
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ───── 1. Auth endpoint rate limiting ─────
  if (request.method === "POST") {
    const limiter = RATE_LIMITED_AUTH_ROUTES[pathname];
    if (limiter) {
      const clientKey = getClientKey(request);
      const key = `${pathname}:${clientKey}`;
      if (!limiter.check(key)) {
        return new NextResponse(
          JSON.stringify({
            message: "Too many attempts. Please try again in a few minutes.",
            code: "RATE_LIMITED",
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": "300",
            },
          },
        );
      }
    }
  }

  // ───── 2. Auth gating for studio routes ─────
  // Lightweight cookie-presence check; actual session validation happens
  // server-side in (main)/layout.tsx via auth.api.getSession().
  if (!isPublicPath(pathname)) {
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    // Require not just presence but a non-empty value — an attacker setting
    // `Cookie: better-auth.session_token=` should not be treated as
    // authenticated, even though server-side validation would still reject.
    const hasValidCookieShape =
      !!sessionCookie && typeof sessionCookie.value === "string" && sessionCookie.value.length >= 16;

    if (!hasValidCookieShape) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ───── 3. CSP nonce for HTML responses ─────
  // Use Web API base64 (btoa) — Buffer is not always available in Edge runtime.
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV === "development";

  // R2 presigned URLs include the bucket as a subdomain
  // (e.g. bucket.account-id.r2.cloudflarestorage.com). For img/media we
  // whitelist the wildcard because URLs vary by bucket+account. For
  // connect-src we narrow to a specific bucket host (R2_BUCKET_HOST env)
  // to limit script-driven exfil to attacker-controlled buckets.
  const r2Wildcard = "https://*.r2.cloudflarestorage.com";
  const r2ImgAllow = [r2Wildcard, R2_DOMAIN].filter(Boolean).join(" ");
  const r2ConnectAllow = [R2_BUCKET_HOST, R2_DOMAIN].filter(Boolean).join(" ") || r2Wildcard;

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: ${r2ImgAllow} https://images.unsplash.com;
    media-src 'self' blob: ${r2ImgAllow};
    connect-src 'self' ${r2ConnectAllow};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  return response;
}

// Match all paths except static assets — same exclusions as the deprecated
// middleware.ts had. This file replaces middleware.ts entirely.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
