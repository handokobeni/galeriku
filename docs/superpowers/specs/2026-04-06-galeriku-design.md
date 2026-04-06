# Galeriku — Design Specification

Personal photo & video gallery app dengan sharing per-album untuk keluarga dan teman.

## Overview

- **Users:** Owner (admin) + invited members (keluarga/teman)
- **Auth:** Login dengan username/password, session-based
- **Permissions:** Per-album (viewer/editor), owner bisa akses semua
- **Storage:** Cloudflare R2 (single private bucket)
- **Database:** PostgreSQL (Neon free tier)
- **Deploy:** Vercel (free tier)
- **Target cost:** $0/bulan untuk skala kecil (5-10 users, < 10GB storage)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Icons | Lucide Icons |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Neon, serverless driver) |
| Auth | Better Auth (session-based, Argon2id) |
| Storage | Cloudflare R2 (single private bucket) |
| Validation | Zod |
| PWA | @serwist/next |
| Package Manager | pnpm |

## Architecture

### System Flow

```
Browser → Next.js (Vercel)  → Neon DB (metadata, auth, permissions)
Browser → Presigned URL     → R2 (direct upload, no server middleman)
Browser → /api/thumbnail/*  → R2 (cached via Vercel Edge)
Browser → Signed URL        → R2 (streaming/download original)
```

### Key Design Decisions

1. **Direct Upload ke R2** — File tidak lewat server Vercel. Presigned URL menghindari limit 4.5MB body size dan menghemat bandwidth.
2. **Neon Serverless Driver** — HTTP-based connection, cocok untuk Vercel serverless. Tidak perlu persistent connection pool.
3. **Thumbnail di Client-side** — Generate thumbnail di browser (Canvas API untuk foto, `<video>` frame capture untuk video, output 400px WebP). Menghindari kebutuhan background job di Vercel.
4. **Single Private R2 Bucket** — Tidak perlu custom domain. Thumbnails diakses via API route yang di-cache Vercel Edge. Originals via signed URL.
5. **Vercel Edge Cache untuk Thumbnails** — `/api/thumbnail/[mediaId]` dengan `Cache-Control: public, max-age=31536000, immutable`. First request hit R2, subsequent requests served dari edge cache.

## Data Model

### User

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | text | unique |
| username | text | unique |
| password_hash | text | Argon2id via Better Auth |
| display_name | text | |
| avatar_url | text | nullable |
| role | enum | `owner` / `member` |
| created_at | timestamp | |
| updated_at | timestamp | |

### Album

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| created_by | uuid | FK → User |
| name | text | |
| description | text | nullable |
| cover_media_id | uuid | nullable, FK → Media |
| created_at | timestamp | |
| updated_at | timestamp | |

### Media

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| album_id | uuid | FK → Album |
| uploaded_by | uuid | FK → User |
| type | enum | `photo` / `video` |
| filename | text | original filename |
| r2_key | text | path in R2 bucket |
| thumbnail_r2_key | text | path in R2 bucket |
| mime_type | text | |
| size_bytes | bigint | |
| width | integer | nullable |
| height | integer | nullable |
| duration | integer | nullable, seconds (video only) |
| created_at | timestamp | |

### AlbumMember

| Column | Type | Notes |
|--------|------|-------|
| album_id | uuid | FK → Album, composite PK |
| user_id | uuid | FK → User, composite PK |
| role | enum | `viewer` / `editor` |
| invited_at | timestamp | |

### Tag

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| name | text | unique |

### MediaTag

| Column | Type | Notes |
|--------|------|-------|
| media_id | uuid | FK → Media, composite PK |
| tag_id | integer | FK → Tag, composite PK |

### Comment

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| media_id | uuid | FK → Media |
| user_id | uuid | FK → User |
| content | text | |
| created_at | timestamp | |

### Favorite

| Column | Type | Notes |
|--------|------|-------|
| media_id | uuid | FK → Media, composite PK |
| user_id | uuid | FK → User, composite PK |
| created_at | timestamp | |

### ActivityLog

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | nullable, FK → User |
| action | enum | `login`, `login_failed`, `logout`, `user_invited`, `user_deactivated`, `album_created`, `album_deleted`, `media_uploaded`, `media_deleted`, `comment_created`, `member_added`, `member_removed`, `settings_changed` |
| entity_type | enum | `user`, `album`, `media`, `comment`, `settings` |
| entity_id | uuid | nullable |
| metadata | jsonb | flexible context data |
| ip_address | text | |
| user_agent | text | |
| created_at | timestamp | |

### AppSettings

| Column | Type | Notes |
|--------|------|-------|
| key | text | PK |
| value | jsonb | |
| updated_at | timestamp | |

Keys: `app_name`, `registration_open`, `max_upload_photo_mb`, `max_upload_video_mb`, `storage_warning_pct`

### Session

Managed by Better Auth (auto-created tables).

### Relationships

- User 1 ↔ N Album (creator)
- User N ↔ N Album (via AlbumMember)
- Album 1 ↔ N Media
- Media N ↔ N Tag (via MediaTag)
- User 1 ↔ N Comment
- Media 1 ↔ N Comment
- User 1 ↔ N Favorite
- Media 1 ↔ N Favorite

## Project Structure (Feature-Based + SOLID)

```
galeriku/
├── src/
│   ├── app/                          ← routing only, thin layer
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── albums/page.tsx
│   │   │   ├── albums/[id]/page.tsx
│   │   │   ├── media/[id]/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── favorites/page.tsx
│   │   ├── (admin)/
│   │   │   ├── admin/page.tsx
│   │   │   ├── admin/users/page.tsx
│   │   │   ├── admin/albums/page.tsx
│   │   │   ├── admin/storage/page.tsx
│   │   │   ├── admin/activity/page.tsx
│   │   │   └── admin/settings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── upload/presign/route.ts
│   │   │   └── thumbnail/[mediaId]/route.ts
│   │   ├── layout.tsx
│   │   └── middleware.ts             ← auth guard
│   │
│   ├── features/                     ← domain logic
│   │   ├── auth/
│   │   │   ├── components/           (LoginForm, RegisterForm)
│   │   │   ├── actions/              (server actions)
│   │   │   ├── hooks/                (useSession)
│   │   │   ├── lib/                  (auth config, client)
│   │   │   └── types.ts
│   │   ├── album/
│   │   │   ├── components/           (AlbumGrid, AlbumCard, AlbumForm)
│   │   │   ├── actions/              (createAlbum, deleteAlbum, inviteMember)
│   │   │   ├── hooks/                (useAlbums, useAlbumMembers)
│   │   │   ├── services/             (album.service.ts)
│   │   │   └── types.ts
│   │   ├── media/
│   │   │   ├── components/           (MediaGrid, MediaViewer, VideoPlayer, Uploader)
│   │   │   ├── actions/              (uploadMedia, deleteMedia)
│   │   │   ├── hooks/                (useMediaUpload, usePresignedUrl)
│   │   │   ├── services/             (media.service.ts, thumbnail.ts)
│   │   │   └── types.ts
│   │   ├── comment/
│   │   │   ├── components/           (CommentList, CommentForm)
│   │   │   ├── actions/
│   │   │   └── services/
│   │   ├── favorite/
│   │   │   ├── components/           (FavoriteButton, FavoriteGrid)
│   │   │   └── actions/
│   │   ├── tag/
│   │   │   ├── components/           (TagInput, TagBadge)
│   │   │   └── actions/
│   │   ├── search/
│   │   │   ├── components/           (SearchBar, SearchResults)
│   │   │   ├── actions/
│   │   │   └── services/             (full-text search queries)
│   │   └── admin/
│   │       ├── components/           (StatsCards, UserList, AlbumTable, ActivityFeed, SettingsForm, StorageBar)
│   │       ├── actions/              (inviteUser, deactivateUser, resetPassword, updateSettings, deleteUser)
│   │       ├── services/             (admin.service.ts — aggregation queries, activity log)
│   │       └── types.ts
│   │
│   ├── shared/                       ← cross-cutting concerns
│   │   ├── components/               (Button, Modal, Avatar, Layout, BottomNav)
│   │   ├── hooks/                    (useDebounce, useInfiniteScroll, useOnlineStatus)
│   │   ├── lib/                      (r2-client.ts, validators.ts, errors.ts)
│   │   └── types/                    (global types, API response types)
│   │
│   └── db/                           ← database layer
│       ├── schema/                   (per-table schema files)
│       ├── migrations/
│       └── index.ts                  (db client export)
│
├── public/
│   ├── manifest.json
│   └── icons/                        (PWA icons)
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Import Rules

- `app/` → imports from `features/`
- `features/` → imports from `shared/`, `db/`
- `features/` → imports from other `features/` (via public API/index.ts)
- `shared/` → NEVER imports from `features/`
- `db/` → NEVER imports from `features/`

### SOLID Principles Applied

- **S (Single Responsibility):** Setiap feature folder punya satu domain. `actions/` untuk mutasi, `services/` untuk query & business logic, `components/` untuk UI.
- **O (Open/Closed):** Feature baru cukup tambah folder di `features/` tanpa mengubah feature lain.
- **L (Liskov Substitution):** Media types (photo/video) share interface `Media`, diproses polymorphically di MediaGrid dan MediaViewer.
- **I (Interface Segregation):** Types kecil & spesifik per feature (`AlbumWithMembers`, `MediaWithTags`), bukan satu god type.
- **D (Dependency Inversion):** Features depend on abstractions di `shared/lib/` (R2 client, validators). DB client di-inject dari `db/index.ts`.

## Security (OWASP Top 10)

### A01 — Broken Access Control

- Middleware auth guard pada semua route `(main)/`
- Permission check di setiap Server Action & API route
- AlbumMember check sebelum akses album/media
- Signed URL untuk R2 — tidak ada direct public access
- Server-side validation, tidak percaya client

### A02 — Cryptographic Failures

- Password hashing: Argon2id (via Better Auth)
- HTTPS enforced (Vercel default)
- Session tokens: cryptographically random, httpOnly, secure, sameSite=lax
- Secrets di environment variables, tidak di code
- R2 credentials hanya di server-side

### A03 — Injection

- Drizzle ORM — parameterized queries (no raw SQL)
- Zod validation di setiap input boundary
- React default escaping (anti-XSS)
- Content-Security-Policy headers
- File type validation (MIME + magic bytes) sebelum upload

### A04 — Insecure Design

- Principle of least privilege — user hanya akses album yang di-assign
- Upload size limit: foto 20MB, video 500MB
- Rate limiting pada auth endpoints & upload
- Thumbnail generated client-side — tidak bisa abuse server resources

### A05 — Security Misconfiguration

- Security headers via next.config.ts (CSP, X-Frame-Options, X-Content-Type-Options)
- R2 bucket private by default
- Error messages generic ke client, detailed di server logs
- No default credentials, owner account setup on first run

### A07 — Auth Failures

- Better Auth handles session management securely
- Rate limit pada login: 5 attempts / 15 min
- Password policy: min 8 chars
- Session expiry & rotation
- Logout invalidates session server-side

### A08 — Software & Data Integrity

- Lockfile (pnpm-lock.yaml) committed
- CSRF protection via SameSite cookies + origin check
- Server Actions validated server-side

### A09 — Logging & Monitoring

- Log auth events (login, failed login, logout)
- Log permission denied attempts
- Structured logging (JSON format)
- No sensitive data in logs

### A10 — SSRF

- Presigned URL generated server-side — user tidak input URL
- R2 key paths sanitized (no path traversal)
- No user-controlled URL fetching

### Security Headers

```
Content-Security-Policy
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin
Permissions-Policy: camera=(), microphone=()
```

## Upload & Media Flow

### R2 Bucket Structure

Single private bucket: `galeriku-storage`

```
originals/{album_id}/{media_id}.{ext}    ← full-res photos & videos
thumbnails/{media_id}.webp                ← 400px WebP thumbnails
```

### Upload Flow (Batch Optimized)

1. **Select files** — validate type & size client-side (photo max 20MB, video max 500MB)
2. **Generate thumbnails** — client-side, parallel via Web Worker pool (Canvas API for photo, `<video>` frame capture for video, output 400px WebP)
3. **Batch presign** — 1 API call → max 20 presigned URL pairs (original + thumbnail). Server validates auth, album permission, file type & size.
4. **Upload to R2** — direct PUT via presigned URL. Concurrency: 3 files. Per-file progress bar. Auto retry max 3x.
5. **Batch metadata insert** — client collects completed uploads, sends batch every 5 files or every 3 seconds. 1 DB transaction per batch.

### View Flow

**Album Grid (thumbnails):**
1. Server fetch media list from DB
2. Return metadata + thumbnail URL (`/api/thumbnail/{mediaId}`)
3. Thumbnails served from Vercel Edge cache (no signed URL needed)
4. Infinite scroll, 20 items per page
5. ISR (Incremental Static Regeneration) — album page cached, revalidated on upload

**Thumbnail Proxy (`/api/thumbnail/[mediaId]`):**
1. Browser request → Vercel Edge cache HIT → return langsung (0 cost)
2. Cache MISS → auth check → fetch from R2 (~30KB) → response with `Cache-Control: public, max-age=31536000, immutable`
3. Subsequent requests from edge cache — no R2 reads, no function invocations

**Full View (original photo):**
1. User clicks media → request signed URL (1hr expiry)
2. Permission check per request
3. Prefetch next/prev for navigation
4. Client cache signed URL until expiry

**Video Streaming:**
1. Signed URL (4hr expiry)
2. HTML5 `<video>` native player
3. R2 supports Range headers → browser handles seek/buffer
4. No transcoding needed

**Download:**
1. Signed URL with `Content-Disposition: attachment`
2. Browser triggers native download with original filename
3. Bulk download: select multiple → JSZip client-side → fetch via signed URLs → zip

### Scalability

| Scenario | Impact |
|----------|--------|
| 20 users upload 50 foto | 50 batch presign calls + 200 batch inserts (vs 1000+1000 tanpa batching) |
| 10 users buka album 200 foto | 0 signed URL generations (Vercel Edge cache thumbnails) |
| 5 users stream video | 5 signed URLs + direct R2 (already efficient) |

## UI/UX (Mobile-First)

### Pages

| Page | Access | Description |
|------|--------|-------------|
| `/setup` | First-time only | Setup wizard, create owner account |
| `/login` | Public | Login form |
| `/register` | Public | Register form (invited users) |
| `/albums` | Protected | Home — album grid |
| `/albums/[id]` | Protected | Album detail — media masonry grid |
| `/media/[id]` | Protected | Full media viewer (lightbox) |
| `/favorites` | Protected | Favorited media grid |
| `/search` | Protected | Search results |
| `/admin` | Owner only | Admin overview — stats, quick links |
| `/admin/users` | Owner only | User management — invite, deactivate, reset password, delete |
| `/admin/albums` | Owner only | Album overview — all albums, delete, transfer ownership |
| `/admin/storage` | Owner only | Storage stats — per-album usage, R2 free tier remaining |
| `/admin/activity` | Owner only | Activity log — uploads, logins, comments, filtered by type/date |
| `/admin/settings` | Owner only | App config — app name, registration, upload limits, storage warning |

### Responsive Strategy

| Aspect | Mobile (default, < 640px) | Tablet (640-1024px) | Desktop (> 1024px) |
|--------|---------------------------|---------------------|---------------------|
| Navigation | Bottom tab bar | Bottom tab bar | Top nav bar |
| Grid columns | 2 | 3 | 4-5 |
| Media viewer | Full-screen, swipe nav, bottom sheet comments | Full-screen, side panel overlay | Lightbox overlay, inline side panel |
| Upload | Camera/gallery picker, bottom sheet progress | Drag & drop + modal | Drag & drop zone + modal |

### Touch Gestures (Mobile)

- Swipe left/right: navigate media in viewer
- Pinch: zoom photo
- Swipe up: show comments in viewer
- Pull down: refresh album

### Desktop Interactions

- Keyboard navigation: ← → (navigate), Esc (close viewer)
- Drag & drop upload zone

### UI Stack

- **Tailwind CSS v4** — styling
- **shadcn/ui** — component library (Button, Dialog, Dropdown, Toast, etc.)
- **Lucide Icons** — iconography
- **next-themes** — theme toggle + persistence
- **Loading:** skeleton states, lazy loading images (IntersectionObserver), optimistic UI updates

### Design System

**Theme:** Light mode default, dark mode toggle. Respects `prefers-color-scheme`.

| Token | Light (default) | Dark (toggle) |
|-------|----------------|---------------|
| Background | `white` | `zinc-950` |
| Surface | `zinc-50` | `zinc-900` |
| Surface alt | `zinc-100` | `zinc-800` |
| Border | `zinc-200` | `zinc-700` |
| Border hover | `zinc-300` | `zinc-600` |
| Muted text | `zinc-500` | `zinc-400` |
| Primary text | `zinc-900` | `zinc-50` |
| Primary accent | `indigo-500` | `indigo-400` |
| Accent | `violet-500` | `violet-400` |

**Context-aware theme:**
- App shell, admin, auth pages → follows user preference (light/dark)
- Media viewer → always dark (immersive experience for photo/video)

**Visual language:**
- Typography: Inter font, -0.5px letter-spacing for headings
- Border radius: 16px cards, 12px media items, 100px pills/chips
- Effects: glass morphism (backdrop-filter blur) for nav bars & overlays
- Gradient accent (indigo → violet) for primary actions (FAB, CTA buttons)
- Motion: 200ms ease transitions, hover lift on cards
- Spacing: 4px base unit, generous padding
- Stacked avatars for member display
- Pill-shaped page indicators in media viewer
- Bottom sheet with drag handle for mobile comments
- Subtle card shadows in light mode, border glow in dark mode

## Admin Dashboard

Owner-only dedicated dashboard di `/admin/*`. Middleware check: `role === 'owner'`, otherwise redirect ke `/albums`.

### Overview (`/admin`)

Stats cards: total users, total albums, total media (foto/video breakdown), storage used. Storage bar (used vs R2 free tier limit). Quick links ke sub-pages.

### User Management (`/admin/users`)

- List semua users dengan status (active/inactive), stats (albums, uploads, last active)
- Invite member: generate invite (email + temporary password)
- Actions per user: reset password, deactivate (revoke access, keep data), reactivate, delete (remove user, reassign media to owner)

### Album Overview (`/admin/albums`)

- List semua albums dengan creator, member count, media count, storage used
- Actions: delete album (+ media from R2), transfer ownership

### Storage Stats (`/admin/storage`)

- Total storage used vs R2 free tier (10GB)
- Per-album storage breakdown
- Storage warning threshold (configurable)

### Activity Log (`/admin/activity`)

- Chronological feed of all logged events (ActivityLog table)
- Filter by: event type, user, date range
- Events tracked: login, login_failed, logout, user_invited, user_deactivated, album_created, album_deleted, media_uploaded, media_deleted, comment_created, member_added, member_removed, settings_changed

### App Settings (`/admin/settings`)

- App name (displayed in header & PWA manifest)
- Registration: open/closed toggle
- Max upload size: photo (default 20MB), video (default 500MB)
- Storage warning threshold (default 80%)

## PWA (Progressive Web App)

### Capabilities

- **Installable:** add to home screen, standalone window, custom splash screen, app icon
- **Offline cache:** viewed thumbnails & app shell available offline
- **Future-ready (v2):** push notifications, background sync, share target

### Service Worker Caching Strategy

| Resource | Strategy | Notes |
|----------|----------|-------|
| App shell (HTML/CSS/JS/fonts) | Cache First | Precache on install, update on new deploy |
| Thumbnails (`/api/thumbnail/*`) | Stale While Revalidate | Instant display, offline browse of viewed albums |
| API data (albums, metadata, comments) | Network First | Fresh data when online, cached data when offline |
| Original media (signed URLs) | Network Only | Large files, URLs expire, no storage bloat |
| Admin pages (`/admin/*`) | Network Only | Always fresh data, no offline caching |

### Cache Budget

- App shell: ~2MB
- Thumbnails: max ~50MB (LRU eviction, max 1500 entries, expire after 30 days)
- Total: ~52MB max

### Implementation

- Library: `@serwist/next` (successor of next-pwa)
- SW registration: auto via @serwist/next plugin in next.config.ts
- Update flow: new SW detected → toast "Update available" → user clicks → reload
- Offline indicator: top banner "You're offline — showing cached content"

### Offline UX

| Status | What works |
|--------|-----------|
| Works offline | App navigation, cached albums, cached thumbnails, cached metadata |
| Degraded | Unseen albums empty, search shows "Offline", comments are cached snapshot, full-res unavailable |
| Requires internet | Upload, post comments, manage members, login/register, video streaming |

### Web App Manifest

```json
{
  "name": "Galeriku",
  "short_name": "Galeriku",
  "description": "Personal photo & video gallery",
  "start_url": "/albums",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Cost Estimation

Asumsi: 5 users aktif, 500 foto + 30 video, ~100 views/hari.

| Service | Usage | Cost |
|---------|-------|------|
| R2 Storage | ~5GB | $0 (free: 10GB) |
| R2 Writes | ~1060/bulan | $0 (free: 10M) |
| R2 Reads | ~3000/bulan (cold cache + originals) | $0 (free: 10M) |
| R2 Egress | All traffic | $0 (always free) |
| Vercel Hobby | Hosting + Edge cache + serverless | $0 |
| Neon Free | 0.5GB storage, auto-suspend | $0 |
| **Total** | | **$0/bulan** |

### When costs start

- R2 storage > 10GB → $0.015/GB/bulan
- Neon storage > 0.5GB → Launch plan $19/bulan
- Vercel bandwidth > 100GB/bulan → Pro plan $20/bulan
