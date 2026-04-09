import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/g/"),
      handler: new NetworkFirst({
        cacheName: "guest-gallery-shell",
        networkTimeoutSeconds: 3,
      }),
    },
    {
      // `process` is not available in service worker scope. We can rely
      // on the wildcard r2.cloudflarestorage.com check alone — it covers
      // all R2 buckets including custom subdomains.
      matcher: ({ url }) => url.hostname.endsWith(".r2.cloudflarestorage.com"),
      handler: new CacheFirst({
        cacheName: "gallery-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 2000,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
