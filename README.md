<div align="center">

# 📸 Galeriku

**Private photo & video gallery for your family — without Google watching.**

A modern, self-hostable photo gallery built for families and small communities who want to share memories without giving them to Big Tech.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-310%20unit%20%2B%2023%20E2E-brightgreen)](#testing)

[**Live Demo**](https://galeriku.vercel.app) · [**Self-Host Guide**](#self-hosting) · [**Roadmap**](#roadmap)

</div>

---

## Why Galeriku?

You take photos. You want to share them with your family. Your only options are:

- **Google Photos** → Free, but Google scans every face, every object, every location.
- **iCloud** → Locked into Apple ecosystem.
- **WhatsApp/Telegram** → Compressed to oblivion, no organization.
- **Self-host Immich** → Powerful, but complex to set up.

**Galeriku is the simple in-between.** It's built specifically for **family photo sharing** with:

- 🔒 **Privacy first** — Files stored in your own Cloudflare R2. No AI scanning. No analytics tracking your photos.
- 👨‍👩‍👧‍👦 **Per-album sharing** — Invite specific people to specific albums. Mom can see family photos. Friends can see vacation photos. Nobody crosses lines.
- 📱 **Mobile-first PWA** — Install on your phone like a native app. Works offline.
- 🚀 **Simple to deploy** — One-click to Vercel. Free tier available with Cloudflare R2 (10GB) + Neon Postgres.
- 🌐 **Self-hostable** — Or run it on your own server. Full data ownership.

## Features

### For everyone
- 📷 Upload photos & videos (up to 20MB / 500MB) directly to Cloudflare R2
- 📁 Create albums with title and description
- 👥 Invite specific users with viewer or editor role
- ❤️ Favorite photos and videos
- 💬 Comment on photos
- 🏷️ Add tags for organization
- 🔍 Search across albums, filenames, and tags
- 📥 Download original files
- 🌓 Light & dark mode

### For album creators
- 🎬 Auto-generated thumbnails (client-side, no server processing)
- ✏️ Full control over members and permissions
- 🔄 Real-time member role management
- 🗑️ Delete albums (cascading cleanup of media)

### For app admins
- 📊 Dashboard with stats (users, albums, media, storage)
- 👤 User management (invite, delete)
- 💾 Storage breakdown per album
- 📜 Activity log for audit trail
- ⚙️ App settings (registration toggle, upload limits)

### Technical highlights
- ⚡ **Next.js 16** with App Router, React Server Components, Turbopack
- 🎨 **Tailwind CSS v4** + shadcn/ui
- 🗄️ **PostgreSQL** with Drizzle ORM
- 🔐 **Better Auth** with Argon2id password hashing
- 🛡️ **OWASP-compliant** security headers + CSP nonce per request
- 📲 **PWA** via @serwist/next (installable, offline-capable)
- 🧪 **310 unit tests** + **23 E2E tests** (Vitest + Playwright)
- 🎯 **Mobile-first** responsive design

## Screenshots

<div align="center">

> **TODO**: Add screenshots/GIFs here. Recommended:
> 1. Hero shot of album grid (mobile + desktop)
> 2. Media viewer with comments side panel
> 3. Upload flow with thumbnail generation
> 4. Admin dashboard
> 5. Member invite with autocomplete

</div>

## Quick Start

### Try the demo
Visit [galeriku.vercel.app](https://galeriku.vercel.app) and click "Try Demo" to explore with sample data.

### Self-hosting

#### Option 1: One-click deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/handokobeni/galeriku)

You'll need:
- A free [Vercel](https://vercel.com) account
- A free [Neon](https://neon.tech) Postgres database
- A free [Cloudflare R2](https://www.cloudflare.com/products/r2/) bucket (10GB free)
- A [Resend](https://resend.com) API key (for password reset emails)

#### Option 2: Local development

**Prerequisites:**
- Node.js 20+
- pnpm 10+
- PostgreSQL 17 (local or via Docker)

```bash
# Clone the repo
git clone https://github.com/handokobeni/galeriku.git
cd galeriku

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, R2 credentials, RESEND_API_KEY

# Run migrations
pnpm db:migrate
pnpm db:seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and follow the setup wizard to create your owner account.

### Environment variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/galeriku

# Better Auth
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Cloudflare R2 (sign up at https://www.cloudflare.com/products/r2/)
R2_ACCOUNT_ID=<your-r2-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
R2_BUCKET_NAME=galeriku-storage
R2_PUBLIC_DOMAIN=https://<account-id>.r2.cloudflarestorage.com

# Resend (for password reset emails)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## How it works

Galeriku is designed around three principles:

### 1. Files never touch your server
When you upload, the browser:
1. Generates a thumbnail using Canvas API (no server processing)
2. Requests presigned URLs from the server (validates auth + permissions)
3. Uploads original + thumbnail directly to Cloudflare R2
4. Saves metadata to your database

This means **no bandwidth costs**, **no upload size limits** (beyond Cloudflare's), and your server stays light.

### 2. Privacy by design
- **No tracking**: No Google Analytics, no Facebook Pixel, no third-party scripts
- **No AI**: Your photos are never analyzed by face recognition or object detection
- **Encrypted at rest**: Cloudflare R2 encrypts data automatically
- **Signed URLs**: Original files served via time-limited URLs (1 hour for photos, 4 hours for videos)
- **Per-album permissions**: Users only see what they're invited to

### 3. Mobile-first PWA
- Installable on iOS/Android via "Add to Home Screen"
- Works offline (cached content)
- Bottom navigation on mobile, sidebar on desktop
- Touch-optimized media viewer

## Permission model

Galeriku has two layers of permissions:

### App-level roles
- **Owner** (admin): Can see all albums, manage users, access admin dashboard
- **Member**: Regular user, sees only albums they're invited to

### Album-level roles
Each album has its own member list with:
- **Owner**: The creator. Can invite, change roles, delete album. Cannot be removed.
- **Editor**: Can upload, delete, tag media. Cannot manage members.
- **Viewer**: Read-only access. Can comment and favorite.

This gives you fine-grained control: a friend can be `editor` on the "Vacation 2024" album but `viewer` on "Family Reunion".

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Latest React features, RSC, Turbopack |
| UI | Tailwind CSS v4 + shadcn/ui | Modern, customizable, no runtime cost |
| Database | PostgreSQL + Drizzle ORM | Type-safe, lightweight, great DX |
| Auth | Better Auth + Argon2id | Modern, secure, modern session management |
| Storage | Cloudflare R2 | Free egress, S3-compatible, generous free tier |
| Email | Resend | Simple API, good free tier |
| PWA | @serwist/next | Successor to next-pwa, actively maintained |
| Testing | Vitest + Playwright | Fast unit tests, reliable E2E |

## Roadmap

### Done ✅
- [x] Auth (setup wizard, login, register, forgot password)
- [x] Album CRUD with permissions
- [x] Media upload (photos + videos)
- [x] Comments, favorites, tags, search
- [x] Admin dashboard
- [x] PWA (installable, offline)
- [x] Mobile-first responsive design
- [x] 310 unit tests + 23 E2E tests

### Coming soon 🚧
- [ ] EXIF metadata extraction (date taken, location, camera)
- [ ] Timeline view (group by month, sort by date taken)
- [ ] Map view (photos with GPS)
- [ ] "On this day" memories
- [ ] Bulk download as ZIP
- [ ] Auto-upload from mobile (PWA background sync)
- [ ] Public share links (expires after 7 days)
- [ ] Face recognition (client-side, privacy-first)

### Long-term 💭
- [ ] AI semantic search (CLIP model, runs in browser)
- [ ] Native iOS/Android apps
- [ ] End-to-end encryption option
- [ ] Album themes & layouts
- [ ] Image editing (crop, rotate, filters)

Vote on features or suggest new ones in [Discussions](https://github.com/handokobeni/galeriku/discussions).

## Testing

```bash
# Unit tests (Vitest)
pnpm test
pnpm test:watch

# E2E tests (Playwright)
pnpm e2e
pnpm e2e:ui      # Interactive UI mode
pnpm e2e:headed  # See browser in action
```

E2E tests run against a separate `galeriku_test` database to avoid clobbering dev data.

## Contributing

Contributions welcome! Whether you're fixing a typo, reporting a bug, or building a new feature:

1. Check the [issues](https://github.com/handokobeni/galeriku/issues) for "good first issue" tags
2. Fork & clone the repo
3. Create a branch (`git checkout -b feat/my-feature`)
4. Follow the existing code style (TDD encouraged — there are 333 tests already)
5. Submit a PR with a clear description

For larger features, please open a discussion first so we can align on approach.

## License

[MIT](LICENSE) — free to use, modify, and self-host. Attribution appreciated but not required.

## Acknowledgements

Built with these excellent open-source projects:

- [Next.js](https://nextjs.org) by Vercel
- [Better Auth](https://better-auth.com) for the auth flow
- [Drizzle ORM](https://orm.drizzle.team) for the database layer
- [shadcn/ui](https://ui.shadcn.com) for the component primitives
- [Serwist](https://serwist.pages.dev) for PWA tooling
- [Lucide](https://lucide.dev) for the icons

---

<div align="center">

**Made with ❤️ in Indonesia**

If Galeriku helps you keep your memories private, consider giving it a ⭐ on GitHub.

[Report a bug](https://github.com/handokobeni/galeriku/issues) · [Request a feature](https://github.com/handokobeni/galeriku/discussions) · [Follow updates](https://github.com/handokobeni/galeriku/releases)

</div>
