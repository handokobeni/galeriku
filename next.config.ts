import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// All security headers (CSP, HSTS, OWASP suite) are now set dynamically
// in src/proxy.ts with per-request nonce. The old static securityHeaders
// array was removed to avoid duplication.

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Hide "X-Powered-By: Next.js" — Next adds this after proxy.ts runs,
  // so response.headers.delete() in middleware doesn't work.
  poweredByHeader: false,
  serverExternalPackages: ["@node-rs/argon2", "@aws-sdk/client-s3"],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withSerwist(nextConfig);
