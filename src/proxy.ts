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

  // ───── 4. OWASP Secure Headers ─────
  // Reference: https://owasp.org/www-project-secure-headers/
  //
  // Permissions-Policy: deny browser features the app doesn't use, so a
  // compromised script can't request them. Trimmed to features that
  // actually matter for our threat model — we skip deprecated APIs and
  // sensors that browsers already gate behind user consent.
  const permissionsPolicy = [
    "camera=()",                      // photographers use file upload, not browser camera
    "microphone=()",                  // no audio capture
    "geolocation=()",                 // no location access
    "payment=()",                     // no Payment Request API (billing comes later)
    "usb=()",                         // no WebUSB
    "display-capture=()",             // block screen recording attempts
    "publickey-credentials-get=()",   // no WebAuthn yet
    "fullscreen=(self)",              // allow only same-origin (lightbox uses it)
  ].join(", ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // CSP — primary defense against XSS / data injection
  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  // HSTS — force HTTPS for 2 years incl subdomains. Production only,
  // because dev runs on http://localhost. Once set in prod, the browser
  // will refuse plain HTTP for the entire domain for max-age seconds.
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Anti-clickjacking. CSP frame-ancestors 'none' already covers this in
  // modern browsers, but X-Frame-Options is still respected by older ones.
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME-type sniffing. Browsers must respect the Content-Type
  // header instead of guessing — stops "polyglot" file uploads from being
  // executed as scripts.
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy. strict-origin-when-cross-origin sends the full URL
  // for same-origin requests, just the origin for cross-origin same-protocol,
  // and nothing for HTTPS→HTTP downgrades.
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable browser features the app doesn't use.
  response.headers.set("Permissions-Policy", permissionsPolicy);

  // Cross-Origin isolation. COOP=same-origin prevents window.opener attacks
  // and process-isolates the page from cross-origin documents. CORP=same-site
  // is the most permissive setting that still blocks cross-site embedding
  // of our resources — chose same-site (not same-origin) so R2 images on a
  // sibling subdomain still load when proxied through our origin in future.
  // COEP is intentionally NOT set: require-corp would break R2 image loads
  // because R2 doesn't return CORP headers.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  // Legacy Adobe Flash policy. Flash is dead but the header is cheap.
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // Hide implementation details — Next.js sets X-Powered-By by default.
  response.headers.delete("X-Powered-By");

  return response;
}

// Match all paths except static assets — same exclusions as the deprecated
// middleware.ts had. This file replaces middleware.ts entirely.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
