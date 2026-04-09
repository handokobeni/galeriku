// Routes that bypass the studio auth gate. Each entry must be either an
// exact path match or use the trailing-slash convention so prefixes can't
// accidentally let unrelated future routes (e.g. `/setupx`, `/api/authority`)
// through the gate.
const PUBLIC_PATH_EXACT = new Set([
  "/",
  "/login",
  "/register",
  "/setup",
  "/forgot-password",
  "/reset-password",
]);

const PUBLIC_PATH_PREFIXES = [
  "/login/",
  "/register/",
  "/setup/",
  "/forgot-password/",
  "/reset-password/",
  "/api/auth/",
  "/g/", // guest gallery sub-app — has its own signed-cookie auth
];

// Public files served from /public — must NOT be auth-gated.
const PUBLIC_FILES = new Set([
  "/sw.js",
  "/swe-worker-development.js",
  "/manifest.json",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
]);

// Root-level static asset extensions that Next serves from /public.
// Anchored regex prevents path traversal style bypasses.
const STATIC_ASSET_RE =
  /^\/[A-Za-z0-9._-]+\.(js|css|map|png|jpg|jpeg|svg|webp|ico|json|txt|xml|webmanifest|woff|woff2|ttf)$/;

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_EXACT.has(pathname)) return true;
  if (PUBLIC_FILES.has(pathname)) return true;
  if (STATIC_ASSET_RE.test(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}
