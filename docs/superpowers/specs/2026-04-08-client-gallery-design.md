# C1 — Client Gallery Design

**Date:** 2026-04-08
**Sub-project:** C1 (first sub-project of Galeriku roadmap)
**Status:** Approved, ready for implementation planning

## Context & Goals

Galeriku adalah SaaS untuk wedding photographer Indonesia. Sub-project C1 membangun **client-facing gallery**: halaman tempat photographer share album wedding ke klien (pasangan pengantin & keluarga) lewat link, mobile-first, install-able sebagai PWA per album.

C1 adalah sub-project pertama dari roadmap karena ini yang membuat photographer punya alasan share Galeriku ke klien (= akuisisi viral) dan alasan untuk berlangganan (= monetization).

### Roadmap context
Roadmap Galeriku didekomposisi menjadi 5 tier:
- **Tier 1 Foundation** (existing): auth, album/media CRUD, R2 storage
- **Tier 2 Core MVP**: **C1 Client Gallery** (this spec), C2 Watermark Engine, C3 Sharing & Access Control
- **Tier 3 Growth**: branding, proofing workflow, notifications, analytics
- **Tier 4 Monetization**: subscription, billing, quota
- **Tier 5 Scale & Ops**: image pipeline, CDN, queue, observability

C1 sengaja didahulukan dari C2 (watermark) dan C3 (advanced sharing) karena C1 membuktikan value paling cepat. C2 & C3 akan terhubung lewat extension point yang sudah disiapkan di C1 (`downloadPolicy`, `access-control` lib).

### Goals
- Klien (non-technical, mobile-first) bisa lihat album wedding dari link WA tanpa install apa-apa
- Optional install ke homescreen sebagai PWA per album dengan branding album
- Klien bisa favorite foto dengan nama supaya photographer tahu siapa pilih apa
- Photographer kontrol siapa boleh download dan dengan watermark atau tidak
- Low cost (R2 egress gratis), scalable (bytes tidak lewat server kita), maintainable (feature-based + SOLID, terisolasi penuh dari studio side)

### Non-goals (sengaja dikeluarkan dari C1)
- Watermark engine (C2)
- Custom domain / studio subdomain (G1)
- Proofing approval workflow (G2)
- Analytics view per orang (G4)
- Subscription/billing (M1)
- Background queue infrastructure (S3 — C1 pakai sync inline dulu)

## Key Decisions

| # | Topic | Decision | Alasan |
|---|---|---|---|
| 1 | Scope | Decompose roadmap, brainstorm C1 mendalam | Project terlalu besar untuk single spec |
| 2 | Access model | Public link + optional password per album | Cover 90% kasus dengan kompleksitas rendah |
| 3 | PWA install scope | Per-album strict (1 manifest per slug) | Mental model jelas: "ini app pernikahan kami" |
| 4 | Offline strategy | Shell + thumbnail default + opt-in download all | Instant value tanpa boros storage |
| 5 | Download policy | Per-album: none / watermarked / clean | Fleksibel, terhubung ke C2 nanti |
| 6 | Favorite | Server-side, di-tag dengan nama klien | Killer feature untuk wedding (siapa pilih apa) |
| 7 | URL structure | Path-based `galeriku.com/g/[slug]` | Fastest to ship, no DNS pain |
| 8 | Guest session | Hybrid: signed cookie unlock + DB row saat input nama | No DB hit di hot path, masih bisa track per-orang |
| 9 | Image delivery | Batch presigned URLs (D'), bytes tidak lewat server kita | R2 egress gratis = low cost + scalable |
| 10 | Async pipeline | Sync inline saat upload (D), migrate ke queue nanti (S3) | Lean MVP, no Redis dulu |
| 11 | UI structure | Single-page grid + adaptive swipe lightbox | Behavior klien wedding = scroll & swipe |
| 12 | Name input flow | Lazy: muncul saat tap favorite pertama kali | Zero friction untuk view |

## Architecture

### Two-app split dalam satu Next.js codebase

```
galeriku/
├── /                   studio side (existing)
│   └── (studio)/       Better Auth, role-based, /albums /admin /login
│
└── /g/[slug]           guest side (NEW)
    ├── Skip Better Auth middleware
    ├── No user row, signed cookies + optional gallery_guests row
    ├── Root layout terpisah (mobile-first, font minimal)
    └── PWA dinamis per album (manifest per slug)
```

**Pemisahan kunci:**
- **Two root layouts** via Next 16 route groups: `(studio)` group dan `g/[slug]` masing-masing punya `<html>` dan `<body>` sendiri. Font/CSS payload guest minimal.
- **Middleware aware**: route `/g/*` skip Better Auth session check, hanya verify cookie guest.
- **Dependency rule (one-way)**: `guest-gallery` feature TIDAK boleh import dari `auth` feature. Studio side tidak boleh import dari `guest-gallery`. Enforced via ESLint `no-restricted-imports`.
- `guest-gallery` boleh import shared `db`, `storage` (R2), `media` (read-only).

### Image delivery (low-cost + scalable)

- **Pre-generated variants saat upload** (sync inline di MVP): `thumb-400`, `preview-1200`, `full-original`, `watermarked-*` (variant watermarked menjadi dependency C2; di C1 cukup struktur jsonb-nya disiapkan).
- **Batch presigned URLs at render**: server (RSC) generate presigned URL untuk semua thumbnail di halaman, TTL 1 jam, pass ke client component sebagai initial props.
- **Klien `<img src>` langsung ke R2** — bytes tidak pernah lewat server Next.js.
- **R2 egress free** → bandwidth cost = $0 untuk delivery.

### Folder structure (feature-based + SOLID)

```
src/features/guest-gallery/
├── components/
│   ├── gallery-grid.tsx           (client) masonry, infinite scroll
│   ├── lightbox.tsx               (client) swipe full-screen, adaptive
│   ├── favorite-heart.tsx         (client) tap → cek cookie → modal/action
│   ├── name-modal.tsx             (client) lazy input nama
│   ├── password-gate.tsx          (client) form unlock
│   ├── album-header.tsx           (server) cover, judul, count
│   ├── install-pwa-button.tsx     (client) beforeinstallprompt
│   ├── offline-toggle.tsx         (client) opt-in download all
│   └── *.test.tsx
├── server/
│   ├── get-album-by-slug.ts       DB lookup + media list
│   ├── unlock-album.ts            verify password, sign cookie
│   ├── register-guest.ts          insert gallery_guests, sign cookie
│   ├── toggle-favorite.ts         insert/delete gallery_favorites
│   ├── batch-presign-urls.ts      generate batch presigned URLs
│   └── *.test.ts
├── lib/
│   ├── cookies.ts                 HMAC sign/verify, env secret
│   ├── slug.ts                    parse/validate/generate
│   ├── access-control.ts          canViewAlbum, canDownload
│   └── *.test.ts
└── types/
    ├── guest-session.ts
    └── gallery-view.ts
```

### Routing

```
src/app/
├── (studio)/                      existing studio routes
│
├── g/
│   └── [slug]/
│       ├── layout.tsx             ROOT layout terpisah (mobile-first)
│       ├── page.tsx               server component, gallery view
│       ├── loading.tsx            skeleton grid
│       ├── not-found.tsx          404
│       ├── manifest.webmanifest/route.ts   dynamic manifest per slug
│       ├── cover.jpg/route.ts     public cover untuk PWA icon (no cookie)
│       └── api/
│           ├── unlock/route.ts    POST password
│           ├── guest/route.ts     POST nama
│           └── favorite/route.ts  POST/DELETE toggle
```

## Data Model

Semua schema tambahan di `src/db/schema/guest-gallery.ts` (atau extend file existing).

### `albums` (existing) — kolom baru

```ts
slug: text("slug").notNull().unique(),
isPublic: boolean("is_public").default(false),
passwordHash: text("password_hash"),                       // null = no password
downloadPolicy: text("download_policy", {
  enum: ['none', 'watermarked', 'clean']
}).default('none'),
coverMediaId: uuid("cover_media_id").references(() => media.id),
publishedAt: timestamp("published_at"),                    // null = draft
expiresAt: timestamp("expires_at"),                        // null = never
```

### `media` (existing) — kolom baru

```ts
variants: jsonb("variants").$type<{
  thumb400?: string;
  preview1200?: string;
  watermarkedPreview?: string;
  watermarkedFull?: string;
}>().default({}),
variantStatus: text("variant_status", {
  enum: ['pending', 'ready', 'failed']
}).default('pending'),
```

### `gallery_guests` (NEW)

```ts
id: uuid().primaryKey().defaultRandom(),
albumId: uuid().notNull().references(() => albums.id, { onDelete: 'cascade' }),
displayName: text().notNull(),
createdAt: timestamp().defaultNow(),
lastSeenAt: timestamp().defaultNow(),
// index: gallery_guests_album_idx on (albumId)
```

### `gallery_favorites` (NEW)

```ts
id: uuid().primaryKey().defaultRandom(),
guestId: uuid().notNull().references(() => galleryGuests.id, { onDelete: 'cascade' }),
mediaId: uuid().notNull().references(() => media.id, { onDelete: 'cascade' }),
createdAt: timestamp().defaultNow(),
// unique: (guestId, mediaId)
// index: gallery_favorites_media_idx on (mediaId)
```

### Yang sengaja TIDAK ada di C1
- Tidak ada `gallery_sessions` table (unlock state pakai signed cookie stateless)
- Tidak ada `gallery_views` / analytics (G4 nanti)
- Tidak ada `gallery_downloads` audit log (G4 nanti)

### Migration & backward compatibility
- Semua kolom baru di tabel existing: nullable atau default value → existing albums tetap valid
- Existing albums otomatis `isPublic=false` → tidak accidental expose
- Tabel baru tambah saja, tidak ubah existing

### Cascade behavior
- Delete album → cascade delete guests + favorites
- Delete media → cascade delete favorite-nya
- Delete guest → cascade delete favorite-nya

## Key Flows

### Flow 1: First visit, album punya password

1. User tap link WA → `GET /g/abc12-andini-reza`
2. RSC `page.tsx`:
   - `getAlbumBySlug("abc12-andini-reza")` → album record
   - Cek cookie `gk_unlock_<albumId>` → tidak ada
   - Render `<PasswordGate>`
3. User input password → `POST /g/[slug]/api/unlock { password }`
4. Server: verify Argon2id, sign cookie `gk_unlock_<albumId> = HMAC({albumId, exp: now+24h})`, set httpOnly Secure SameSite=Lax, return 200
5. Client refresh → RSC re-render
6. Cookie valid → fetch media list → `batchPresignUrls(mediaList, ttl=1h)` → pass ke `<GalleryGrid>`
7. Render `<AlbumHeader>` + `<GalleryGrid>` + `<InstallPwaButton>` + `<OfflineToggle>`

### Flow 2: First favorite (lazy name input)

1. `<FavoriteHeart>` onClick → cek cookie `gk_guest` → tidak ada
2. Open `<NameModal>`
3. User input "Tante Sinta" → `POST /g/[slug]/api/guest { name }`
4. Server: verify unlock cookie exists, INSERT `gallery_guests`, sign cookie `gk_guest = HMAC({guestId, exp: now+30d})`, return guestId
5. Modal close → auto-call `POST /g/[slug]/api/favorite { photoId }`
6. Server: verify guest cookie, INSERT `gallery_favorites` ON CONFLICT DO NOTHING
7. Optimistic UI update, heart filled

### Flow 3: Subsequent favorites
Cookie ada → skip modal → langsung POST favorite → optimistic update.

### Flow 4: Lightbox + download

1. Tap thumbnail → `<Lightbox>` full-screen
2. Mobile: 100vh, swipe horizontal touch event, tap = close
3. Desktop: modal overlay, panah kiri/kanan + ESC
4. `<img>` src = `previewUrl` (1200px), bukan full-original
5. Bottom bar: ♡ favorite, ⬇ download (kalau policy ≠ 'none')
6. Download button per policy:
   - `none` → button hidden
   - `watermarked` → request presigned URL untuk `variants.watermarkedFull`
   - `clean` → request presigned URL untuk `full-original`
7. **Server-side enforcement**: endpoint download juga check policy, tidak hanya UI hide.

### Flow 5: PWA install (per album)

1. RSC inject `<link rel="manifest" href="/g/[slug]/manifest.webmanifest" />`
2. Browser fetch manifest route:
   ```json
   {
     "name": "Andini & Reza Wedding",
     "short_name": "Andini & Reza",
     "start_url": "/g/abc12-andini-reza",
     "scope": "/g/abc12-andini-reza",
     "display": "standalone",
     "theme_color": "#FAF7F2",
     "background_color": "#1A1A1A",
     "icons": [{ "src": "/g/abc12-andini-reza/cover.jpg", "sizes": "512x512", "type": "image/jpeg" }]
   }
   ```
3. `<InstallPwaButton>` listen `beforeinstallprompt`, tampil tombol "Install Album" hanya kalau prompt available & belum installed
4. Click → `deferredPrompt.prompt()`

**Catatan:** `cover.jpg` route harus accessible tanpa cookie (PWA install fetch tidak bawa cookie session). Hanya serve jika album `isPublic=true`.

### Flow 6: Offline opt-in download

1. `<OfflineToggle>` button "Save album for offline (~1.2 GB)"
2. Click → konfirmasi modal
3. Confirm → service worker pre-cache semua URL preview1200 dari mediaList
4. Progress UI: "Caching 47/248..."
5. Done → tombol "Saved offline ✓ (delete)"
6. SW strategy:
   - Default `/g/[slug]/*` → NetworkFirst dengan cache fallback
   - Saat opt-in: pre-cache list of URLs ke cache `gallery-album-<id>-v1`
   - Lightbox image → CacheFirst (cek album cache dulu, fallback network)

### Flow 7: Photographer publish album (studio side, perubahan kecil)

1. Studio buka album existing → toggle "Publish to client"
2. Modal: input password (opsional), set download policy, set expiry (opsional)
3. Submit → server action `publishAlbum`:
   - Generate slug `<random5>-<kebab(title)>` (cek uniqueness, retry kalau collision)
   - Hash password kalau diisi
   - Set `isPublic=true`, `publishedAt=now`, `slug`, `downloadPolicy`, `expiresAt`
4. Tampilkan link `galeriku.com/g/abc12-andini-reza` + tombol copy
5. Photographer share via WA

## Error Handling & Edge Cases

| Skenario | Handling |
|---|---|
| Slug tidak ditemukan | `not-found.tsx`, pesan netral, jangan reveal "ada tapi belum publish" |
| Album `isPublic=false` | Treat as 404 |
| Album expired (`expiresAt` lewat) | 410 Gone, "Album sudah berakhir" |
| Password salah | 401, "Password salah", rate limit 5/15min per IP+albumId |
| Cookie unlock expired | Redirect ke password gate (atau langsung gallery kalau public) |
| Cookie tampering / signature invalid | Treat as no-cookie (ignore) |
| Presigned URL expired di tengah session | Client detect 403 → trigger refresh page |
| Foto pending variant | Skeleton placeholder, polling status setiap 5s |
| Variant generation gagal | Fallback ke original, log error |
| Tap favorite tanpa cookie unlock | 403 (defensive) |
| Duplicate favorite race | DB unique constraint, idempotent return |
| Album dihapus saat klien viewing | Next request 404 |
| Storage R2 down | Per-foto retry button |
| DB down | 503 retry page |
| Album kosong | "Photographer belum upload foto" |
| Cover photo belum ada | Gradient warna brand + text title |
| Browser tanpa SW support | Fallback fetch, hide install/offline buttons |
| Klien install PWA tapi album expired | Buka PWA → halaman 410 |

## Security

1. **Slug guessability**: format `<5char base36>-<kebab-title>`, ~60M kombinasi + password layer.
2. **Cookie signing**: HMAC-SHA256, env secret `GUEST_COOKIE_SECRET` (terpisah dari Better Auth secret), constant-time verify.
3. **Cookie attributes**: `httpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/g/[slug]` (scope per album).
4. **Password hashing**: Argon2id via `@node-rs/argon2`, parameter sama dengan user password.
5. **Rate limiting** (in-memory Map dengan TTL untuk MVP, migrate ke Redis nanti):
   - Unlock attempts: 5 / 15min per IP+albumId
   - Favorite toggle: 60 / min per guest
   - Guest registration: 3 / hour per IP per album
6. **CSRF**: route handlers check `Origin` header + SameSite=Lax cookie.
7. **CSP**: existing `proxy.ts` sudah include R2 di `img-src`, no perubahan needed.
8. **Presigned URL TTL**: 1 jam.
9. **Cover endpoint public** hanya jika `isPublic=true`.
10. **No PII di logs**: jangan log displayName, password attempts, IP. Log albumId + error code.
11. **Server-side download enforcement**: endpoint cek `downloadPolicy` walaupun UI sudah hide tombol (defense in depth).

## Testing Strategy

Mengikuti TDD: tulis failing test dulu, baru implementasi. Test pakai DB `galeriku_test`.

### Unit tests (vitest + happy-dom + @testing-library/react)

`lib/`:
- `cookies.test.ts` — sign/verify roundtrip, tampered rejected, expired rejected, constant-time
- `slug.test.ts` — generate format, parse, validate, collision detection
- `access-control.test.ts` — `canDownload(album, policy)` matrix

`components/`:
- `password-gate.test.tsx` — submit, error display, loading state
- `name-modal.test.tsx` — input validation, submit, close
- `favorite-heart.test.tsx` — tap tanpa cookie → modal open, dengan cookie → action, optimistic + rollback
- `gallery-grid.test.tsx` — render, infinite scroll, empty state
- `lightbox.test.tsx` — open/close, swipe, ESC, download button visibility per policy
- `install-pwa-button.test.tsx` — beforeinstallprompt mock, hide kalau installed
- `offline-toggle.test.tsx` — pre-cache trigger, progress, delete cache

### Integration tests (vitest + DB nyata)

`server/`:
- `unlock-album.test.ts` — password benar/salah, no password, rate limit, expired
- `register-guest.test.ts` — insert, set cookie, duplicate name allowed
- `toggle-favorite.test.ts` — add, remove, idempotent, cascade
- `get-album-by-slug.test.ts` — found, 404, not public, expired, returns variant status
- `batch-presign-urls.test.ts` — batch generate, TTL, shape

### API route tests (vitest)

- `unlock/route.test.ts`
- `guest/route.test.ts`
- `favorite/route.test.ts`
- `manifest.webmanifest/route.test.ts`
- `cover.jpg/route.test.ts`

### E2E tests (Playwright, `e2e/guest-gallery.spec.ts`)

1. Public album, no password → view → favorite with name → reload → still saved
2. Album with password → wrong → right → cookie persist
3. Lightbox + download (watermarked) — assert download event
4. Album expired → 410 page
5. PWA manifest fetch → assert shape
6. Wrong slug → 404

### Existing tests yang terdampak
- Album CRUD tests perlu update untuk kolom baru
- Migration test untuk backward compat

### Coverage target
- Unit: 80%+ statements
- Integration: 100% server actions
- E2E: 6 critical journeys
- Total: maintain 310 existing tests + tambah ~80-120 baru

### TDD implementation order (high-level, akan didetailkan di plan)

1. Schema + migration
2. `lib/cookies` → unit → impl
3. `lib/slug` → unit → impl
4. `lib/access-control` → unit → impl
5. `server/get-album-by-slug` → integration → impl
6. `server/unlock-album` → integration → impl
7. `server/register-guest` → integration → impl
8. `server/toggle-favorite` → integration → impl
9. `server/batch-presign-urls` → integration → impl
10. API routes → impl
11. Components bottom-up
12. Page composition (RSC)
13. Dynamic manifest route
14. Service worker offline strategy (manual test)
15. Studio side: publish flow

## Operational Notes

- **Cost estimate** untuk 100 photographer aktif (~50 album/bln, ~30k foto):
  - R2 storage: ~500 GB × $0.015 = ~$7.5/bln
  - R2 egress: $0
  - Hosting (VPS Hetzner CX22): ~$6/bln
  - DB (Neon free → Pro nanti): $0–19/bln
  - Resend (free → Pro nanti): $0–20/bln
  - **Total awal: $15–50/bln**
- **Bottleneck nanti**: sync inline variant generation (D) — saat photographer upload 200 foto sekaligus, request bisa makan 30-60 detik. Migrate ke S3 (BullMQ + Redis worker) jadi prioritas saat user real bertambah.
- **Migration ke queue (D → B)**: cuma butuh extract logic ke job handler dan panggil dari worker — tidak ada perubahan API publik.

## Out of Scope (akan masuk sub-project lain)

- Watermark engine real (C2)
- Custom domain / studio subdomain (G1)
- Proofing approval workflow (G2)
- Notification email saat klien favorite (G3)
- Analytics view per orang (G4)
- Subscription/billing (M1)
- Background queue infrastructure (S3)
