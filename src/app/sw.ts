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
      matcher: ({ url }) =>
        url.hostname.includes("r2.cloudflarestorage.com") ||
        (process.env.NEXT_PUBLIC_R2_HOST
          ? url.hostname.includes(process.env.NEXT_PUBLIC_R2_HOST)
          : false),
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
