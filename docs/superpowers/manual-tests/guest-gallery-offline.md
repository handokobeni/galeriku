# Manual test: Guest gallery offline mode

After Task 18 (service worker rules) and Task 16 (page composition).

## Setup
1. `pnpm build && pnpm start`
2. Studio: log in, create an album, upload ~10 photos
3. Studio: publish album → copy generated `/g/[slug]` link
4. Open the link in a fresh browser profile (or incognito)

## Test 1: PWA install
- Open `/g/[slug]` → check browser shows "Install app" prompt (Chrome/Edge)
- Click Install Album button → confirm install
- Open the installed app → should land on the album page

## Test 2: Offline shell
- After first visit, toggle DevTools → Network → Offline
- Reload `/g/[slug]` → page shell still renders (header, grid skeleton)
- Photos may show broken — that's expected unless you opted in to offline

## Test 3: Opt-in offline (full album)
- Back online, click "Save offline" button
- Wait for `Caching N/M...` to finish
- Toggle Offline again → reload → photos still appear (cached from R2)

## Test 4: Cache eviction
- Open DevTools → Application → Cache Storage
- Confirm caches: `guest-gallery-shell`, `gallery-images`, `gallery-album-<id>-v1`
