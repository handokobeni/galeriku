import { NextRequest, NextResponse } from "next/server";
import { loginLimiter, signupLimiter, type RateLimiter } from "@/shared/lib/rate-limit";
import { getClientKey } from "@/shared/lib/client-ip";

const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN ?? "";

// Auth endpoints rate-limited at the edge before reaching Better Auth.
// Belt-and-suspenders layer on top of Better Auth's own rateLimit config —
// guarantees protection regardless of Better Auth's internal storage state
// and uses our shared in-memory limiter so the budget is consistent with
// the rest of the app.
const RATE_LIMITED_AUTH_ROUTES: Record<string, RateLimiter> = {
  "/api/auth/sign-in/email": loginLimiter,
  "/api/auth/sign-up/email": signupLimiter,
};

export function proxy(request: NextRequest) {
  // ───── Auth rate limiting ─────
  if (request.method === "POST") {
    const path = request.nextUrl.pathname;
    const limiter = RATE_LIMITED_AUTH_ROUTES[path];
    if (limiter) {
      const clientKey = getClientKey(request);
      const key = `${path}:${clientKey}`;
      if (!limiter.check(key)) {
        return new NextResponse(
          JSON.stringify({
            error: "Too many attempts. Please try again in a few minutes.",
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

  // ───── Existing CSP nonce flow ─────
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: ${R2_DOMAIN} https://images.unsplash.com;
    media-src 'self' blob: ${R2_DOMAIN};
    connect-src 'self' ${R2_DOMAIN};
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
