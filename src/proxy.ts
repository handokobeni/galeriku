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

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/setup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/g/", // guest gallery sub-app — has its own auth via signed cookies
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

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

    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ───── 3. CSP nonce for HTML responses ─────
  // Use Web API base64 (btoa) — Buffer is not always available in Edge runtime.
  const nonce = btoa(crypto.randomUUID());
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

// Match all paths except static assets — same exclusions as the deprecated
// middleware.ts had. This file replaces middleware.ts entirely.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
