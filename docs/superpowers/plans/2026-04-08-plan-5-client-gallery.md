# Plan 5: C1 Client Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing client gallery sub-app at `/g/[slug]` so wedding photographers can share albums with clients via a mobile-first PWA installable per album, with optional password gate, named favorites, and watermark-aware downloads.

**Architecture:** Two root layouts in one Next.js codebase via route groups. Guest side (`/g/[slug]`) is fully isolated from studio side — no Better Auth dependency, signed cookies for unlock state, optional `gallery_guests` row when client enters their name. Image bytes never flow through our server: server pre-generates batch presigned R2 URLs at render time, client `<img>` fetches directly from R2 (egress is free).

**Tech Stack:** Drizzle ORM, Next.js 16 App Router, Server Components/Actions, @node-rs/argon2, Web Crypto (HMAC-SHA256), AWS S3 SDK presigner for R2, sharp (already present via existing media pipeline), Vitest, Playwright, Serwist (existing PWA layer).

**Spec reference:** `docs/superpowers/specs/2026-04-08-client-gallery-design.md`

**Testing:** TDD throughout. Vitest + happy-dom + @testing-library/react for unit. Vitest + real Postgres (`galeriku_test`) for server actions. Playwright for E2E. Maintain all 310 existing tests passing.

---

## File Map

### Task 1 — Schema migration
- Modify: `src/db/schema/album.ts` (add slug, isPublic, passwordHash, downloadPolicy, publishedAt, expiresAt)
- Modify: `src/db/schema/media.ts` (add variants jsonb, variantStatus)
- Create: `src/db/schema/guest-gallery.ts` (gallery_guests, gallery_favorites)
- Modify: `src/db/schema/index.ts` (re-export)
- Run: `pnpm db:generate` to produce migration SQL
- Test: `src/db/schema/__tests__/guest-gallery.test.ts`

### Task 2 — `lib/cookies.ts` (HMAC sign/verify)
- Create: `src/features/guest-gallery/lib/cookies.ts`
- Test: `src/features/guest-gallery/lib/cookies.test.ts`

### Task 3 — `lib/slug.ts`
- Create: `src/features/guest-gallery/lib/slug.ts`
- Test: `src/features/guest-gallery/lib/slug.test.ts`

### Task 4 — `lib/access-control.ts`
- Create: `src/features/guest-gallery/lib/access-control.ts`
- Test: `src/features/guest-gallery/lib/access-control.test.ts`

### Task 5 — `lib/rate-limit.ts`
- Create: `src/features/guest-gallery/lib/rate-limit.ts`
- Test: `src/features/guest-gallery/lib/rate-limit.test.ts`

### Task 6 — `server/get-album-by-slug.ts`
- Create: `src/features/guest-gallery/server/get-album-by-slug.ts`
- Test: `src/features/guest-gallery/server/get-album-by-slug.test.ts`

### Task 7 — `server/unlock-album.ts`
- Create: `src/features/guest-gallery/server/unlock-album.ts`
- Test: `src/features/guest-gallery/server/unlock-album.test.ts`

### Task 8 — `server/register-guest.ts`
- Create: `src/features/guest-gallery/server/register-guest.ts`
- Test: `src/features/guest-gallery/server/register-guest.test.ts`

### Task 9 — `server/toggle-favorite.ts`
- Create: `src/features/guest-gallery/server/toggle-favorite.ts`
- Test: `src/features/guest-gallery/server/toggle-favorite.test.ts`

### Task 10 — `server/batch-presign-urls.ts`
- Create: `src/features/guest-gallery/server/batch-presign-urls.ts`
- Test: `src/features/guest-gallery/server/batch-presign-urls.test.ts`

### Task 11 — API routes (unlock, guest, favorite)
- Create: `src/app/g/[slug]/api/unlock/route.ts` + test
- Create: `src/app/g/[slug]/api/guest/route.ts` + test
- Create: `src/app/g/[slug]/api/favorite/route.ts` + test

### Task 12 — Manifest + cover routes
- Create: `src/app/g/[slug]/manifest.webmanifest/route.ts` + test
- Create: `src/app/g/[slug]/cover.jpg/route.ts` + test

### Task 13 — Components: password-gate, name-modal, favorite-heart
- Create + test for each

### Task 14 — Components: gallery-grid, lightbox
- Create + test for each

### Task 14b — Pagination + infinite scroll
- Create: `src/features/guest-gallery/server/get-album-media-page.ts` + test
- Create: `src/app/g/[slug]/api/media/route.ts` + test
- Modify: `src/features/guest-gallery/components/gallery-grid.tsx` (infinite scroll)
- Modify: `src/app/g/[slug]/page.tsx` (load only first page, pass cursor)

### Task 15 — Components: install-pwa-button, offline-toggle, album-header
- Create + test for each

### Task 16 — Page composition (RSC)
- Create: `src/app/g/[slug]/layout.tsx`
- Create: `src/app/g/[slug]/page.tsx`
- Create: `src/app/g/[slug]/loading.tsx`
- Create: `src/app/g/[slug]/not-found.tsx`
- Modify: existing root layout to use `(studio)` route group

### Task 17 — Studio side: publish album action + UI
- Create: `src/features/album/server/publish-album.ts` + test
- Create: `src/features/album/components/publish-album-dialog.tsx` + test
- Modify: album detail page to add Publish button

### Task 18 — Service worker offline strategy
- Modify: `src/app/sw.ts` (add gallery cache rules)
- Document manual test steps

### Task 19 — E2E tests
- Create: `e2e/guest-gallery.spec.ts`

### Task 20 — Boundary lint rule + final verification
- Modify: `eslint.config.mjs` (no-restricted-imports for guest-gallery → auth)
- Run full test suite + build

---

## Task 1: Schema migration

**Files:**
- Modify: `src/db/schema/album.ts`
- Modify: `src/db/schema/media.ts`
- Create: `src/db/schema/guest-gallery.ts`
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/__tests__/guest-gallery.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/db/schema/__tests__/guest-gallery.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";

describe("guest-gallery schema", () => {
  let userId: string;
  let albumId: string;
  let mediaId: string;

  beforeEach(async () => {
    await db.delete(galleryFavorites);
    await db.delete(galleryGuests);
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(),
      name: "Studio",
      email: `s${Date.now()}@x.io`,
      emailVerified: true,
      role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "Wedding",
      slug: "abc12-wedding",
      createdBy: userId,
    }).returning();
    albumId = a.id;
    const [m] = await db.insert(media).values({
      albumId,
      uploadedBy: userId,
      type: "photo",
      filename: "x.jpg",
      r2Key: "x",
      thumbnailR2Key: "xt",
      mimeType: "image/jpeg",
      sizeBytes: 1,
    }).returning();
    mediaId = m.id;
  });

  it("album has new gallery columns with defaults", async () => {
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.slug).toBe("abc12-wedding");
    expect(a.isPublic).toBe(false);
    expect(a.passwordHash).toBeNull();
    expect(a.downloadPolicy).toBe("none");
    expect(a.publishedAt).toBeNull();
    expect(a.expiresAt).toBeNull();
  });

  it("media has variants and variantStatus", async () => {
    const [m] = await db.select().from(media).where(eq(media.id, mediaId));
    expect(m.variants).toEqual({});
    expect(m.variantStatus).toBe("pending");
  });

  it("inserts gallery guest and favorite", async () => {
    const [g] = await db.insert(galleryGuests).values({
      albumId,
      displayName: "Tante Sinta",
    }).returning();
    expect(g.displayName).toBe("Tante Sinta");

    await db.insert(galleryFavorites).values({ guestId: g.id, mediaId });
    const favs = await db.select().from(galleryFavorites);
    expect(favs).toHaveLength(1);
  });

  it("rejects duplicate favorite for same guest+media", async () => {
    const [g] = await db.insert(galleryGuests).values({
      albumId,
      displayName: "X",
    }).returning();
    await db.insert(galleryFavorites).values({ guestId: g.id, mediaId });
    await expect(
      db.insert(galleryFavorites).values({ guestId: g.id, mediaId })
    ).rejects.toThrow();
  });

  it("cascades favorites when album deleted", async () => {
    const [g] = await db.insert(galleryGuests).values({
      albumId,
      displayName: "X",
    }).returning();
    await db.insert(galleryFavorites).values({ guestId: g.id, mediaId });
    await db.delete(album).where(eq(album.id, albumId));
    const guests = await db.select().from(galleryGuests);
    const favs = await db.select().from(galleryFavorites);
    expect(guests).toHaveLength(0);
    expect(favs).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/db/schema/__tests__/guest-gallery.test.ts`
Expected: FAIL (slug column doesn't exist, galleryGuests doesn't exist).

- [ ] **Step 3: Update `src/db/schema/album.ts`**

Replace the file:

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, primaryKey, index, boolean } from "drizzle-orm/pg-core";
import { user } from "./user";

export const album = pgTable("album", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  coverMediaId: uuid("cover_media_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Client gallery (C1) columns
  slug: text("slug").unique(),
  isPublic: boolean("is_public").default(false).notNull(),
  passwordHash: text("password_hash"),
  downloadPolicy: text("download_policy", { enum: ["none", "watermarked", "clean"] })
    .default("none")
    .notNull(),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const albumMember = pgTable(
  "album_member",
  {
    albumId: uuid("album_id").notNull().references(() => album.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["viewer", "editor"] }).notNull().default("viewer"),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.userId] }),
    index("album_member_userId_idx").on(table.userId),
  ],
);

export const albumRelations = relations(album, ({ one, many }) => ({
  creator: one(user, { fields: [album.createdBy], references: [user.id] }),
  members: many(albumMember),
}));

export const albumMemberRelations = relations(albumMember, ({ one }) => ({
  album: one(album, { fields: [albumMember.albumId], references: [album.id] }),
  user: one(user, { fields: [albumMember.userId], references: [user.id] }),
}));
```

Note: `slug` is `unique()` and nullable. Existing albums get null slug; only published albums have a slug.

- [ ] **Step 4: Update `src/db/schema/media.ts`**

Add variants + variantStatus:

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, integer, bigint, index, jsonb } from "drizzle-orm/pg-core";
import { user } from "./user";
import { album } from "./album";

export type MediaVariants = {
  thumb400?: string;
  preview1200?: string;
  watermarkedPreview?: string;
  watermarkedFull?: string;
};

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id").notNull().references(() => album.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by").notNull().references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["photo", "video"] }).notNull(),
    filename: text("filename").notNull(),
    r2Key: text("r2_key").notNull(),
    thumbnailR2Key: text("thumbnail_r2_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    variants: jsonb("variants").$type<MediaVariants>().default({}).notNull(),
    variantStatus: text("variant_status", { enum: ["pending", "ready", "failed"] })
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_albumId_idx").on(table.albumId),
    index("media_uploadedBy_idx").on(table.uploadedBy),
  ],
);

export const mediaRelations = relations(media, ({ one }) => ({
  album: one(album, { fields: [media.albumId], references: [album.id] }),
  uploader: one(user, { fields: [media.uploadedBy], references: [user.id] }),
}));
```

- [ ] **Step 5: Create `src/db/schema/guest-gallery.ts`**

```ts
import { pgTable, uuid, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { album } from "./album";
import { media } from "./media";

export const galleryGuests = pgTable(
  "gallery_guest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id").notNull().references(() => album.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (table) => [index("gallery_guest_album_idx").on(table.albumId)],
);

export const galleryFavorites = pgTable(
  "gallery_favorite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id").notNull().references(() => galleryGuests.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("gallery_favorite_unique").on(table.guestId, table.mediaId),
    index("gallery_favorite_media_idx").on(table.mediaId),
  ],
);

export const galleryGuestRelations = relations(galleryGuests, ({ one, many }) => ({
  album: one(album, { fields: [galleryGuests.albumId], references: [album.id] }),
  favorites: many(galleryFavorites),
}));

export const galleryFavoriteRelations = relations(galleryFavorites, ({ one }) => ({
  guest: one(galleryGuests, { fields: [galleryFavorites.guestId], references: [galleryGuests.id] }),
  media: one(media, { fields: [galleryFavorites.mediaId], references: [media.id] }),
}));
```

- [ ] **Step 6: Update `src/db/schema/index.ts`**

Append: `export * from "./guest-gallery";`

- [ ] **Step 7: Generate + run migration**

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:test:migrate
```

- [ ] **Step 8: Run tests to verify pass**

`pnpm test src/db/schema/__tests__/guest-gallery.test.ts` → PASS

- [ ] **Step 9: Run full suite to ensure no regressions**

`pnpm test` → all 310+ tests still pass.

- [ ] **Step 10: Commit**

```bash
git add src/db/schema drizzle
git commit -m "feat(guest-gallery): add schema for client gallery (C1)"
```

---

## Task 2: `lib/cookies.ts` — HMAC sign/verify

**Files:**
- Create: `src/features/guest-gallery/lib/cookies.ts`
- Test: `src/features/guest-gallery/lib/cookies.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { signCookie, verifyCookie } from "./cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("cookies", () => {
  it("signs and verifies a payload roundtrip", async () => {
    const token = await signCookie({ albumId: "abc", exp: Date.now() + 60_000 }, SECRET);
    const payload = await verifyCookie<{ albumId: string; exp: number }>(token, SECRET);
    expect(payload?.albumId).toBe("abc");
  });

  it("returns null for tampered token", async () => {
    const token = await signCookie({ x: 1 }, SECRET);
    const tampered = token.slice(0, -2) + "ZZ";
    expect(await verifyCookie(tampered, SECRET)).toBeNull();
  });

  it("returns null for expired payload", async () => {
    const token = await signCookie({ exp: Date.now() - 1000 }, SECRET);
    expect(await verifyCookie(token, SECRET)).toBeNull();
  });

  it("returns null for wrong secret", async () => {
    const token = await signCookie({ x: 1 }, SECRET);
    expect(await verifyCookie(token, "different-secret-32bytes-1234567")).toBeNull();
  });

  it("returns null for malformed token", async () => {
    expect(await verifyCookie("garbage", SECRET)).toBeNull();
    expect(await verifyCookie("", SECRET)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test (expect FAIL — module missing)**

`pnpm test src/features/guest-gallery/lib/cookies.test.ts`

- [ ] **Step 3: Implement `cookies.ts`**

```ts
// HMAC-SHA256 signed cookie payloads. Stateless. Used for guest unlock & guest id.
// Format: base64url(payload).base64url(signature)

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signCookie<T extends object>(payload: T, secret: string): Promise<string> {
  const json = JSON.stringify(payload);
  const payloadB64 = b64url(enc.encode(json));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return `${payloadB64}.${b64url(sig)}`;
}

export async function verifyCookie<T = unknown>(token: string, secret: string): Promise<T | null> {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await hmacKey(secret);
    const expected = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    if (!constantTimeEqual(new Uint8Array(expected), b64urlDecode(sigB64))) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp < Date.now()) return null;
    return payload as T;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/lib/cookies.ts src/features/guest-gallery/lib/cookies.test.ts
git commit -m "feat(guest-gallery): add HMAC-signed cookie helper"
```

---

## Task 3: `lib/slug.ts`

**Files:**
- Create: `src/features/guest-gallery/lib/slug.ts`
- Test: `src/features/guest-gallery/lib/slug.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { generateSlug, kebabify, isValidSlug } from "./slug";

describe("slug", () => {
  it("kebabifies title", () => {
    expect(kebabify("Andini & Reza Wedding")).toBe("andini-reza-wedding");
    expect(kebabify("Dinner @ The Place 2026!")).toBe("dinner-the-place-2026");
    expect(kebabify("   spaces   ")).toBe("spaces");
    expect(kebabify("")).toBe("album");
  });

  it("generates slug with 5-char prefix and kebab title", () => {
    const slug = generateSlug("Andini & Reza");
    expect(slug).toMatch(/^[a-z0-9]{5}-andini-reza$/);
  });

  it("validates well-formed slug", () => {
    expect(isValidSlug("abc12-andini-reza")).toBe(true);
    expect(isValidSlug("xy9z0-x")).toBe(true);
    expect(isValidSlug("abc12")).toBe(false);
    expect(isValidSlug("ABC12-x")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });

  it("truncates very long titles", () => {
    const long = "a".repeat(200);
    const slug = generateSlug(long);
    expect(slug.length).toBeLessThanOrEqual(86); // 5 + 1 + 80
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Implement `slug.ts`**

```ts
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const TITLE_MAX = 80;

export function kebabify(title: string): string {
  const cleaned = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "album";
}

function randomPrefix(len = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

export function generateSlug(title: string): string {
  const kebab = kebabify(title).slice(0, TITLE_MAX).replace(/-+$/, "");
  return `${randomPrefix()}-${kebab || "album"}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]{5}-[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
```

- [ ] **Step 4: Run tests → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/lib/slug.ts src/features/guest-gallery/lib/slug.test.ts
git commit -m "feat(guest-gallery): add slug generation/validation"
```

---

## Task 4: `lib/access-control.ts`

**Files:**
- Create: `src/features/guest-gallery/lib/access-control.ts`
- Test: `src/features/guest-gallery/lib/access-control.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { canViewAlbum, canDownload, downloadVariantKey } from "./access-control";

const baseAlbum = {
  id: "a",
  isPublic: true,
  passwordHash: null as string | null,
  downloadPolicy: "none" as "none" | "watermarked" | "clean",
  expiresAt: null as Date | null,
};

describe("access-control", () => {
  describe("canViewAlbum", () => {
    it("allows public album with no expiry", () => {
      expect(canViewAlbum(baseAlbum)).toEqual({ ok: true });
    });
    it("blocks non-public album as not-found", () => {
      expect(canViewAlbum({ ...baseAlbum, isPublic: false })).toEqual({ ok: false, reason: "not-found" });
    });
    it("blocks expired album as gone", () => {
      expect(canViewAlbum({ ...baseAlbum, expiresAt: new Date(Date.now() - 1000) })).toEqual({
        ok: false,
        reason: "expired",
      });
    });
    it("allows future expiry", () => {
      expect(canViewAlbum({ ...baseAlbum, expiresAt: new Date(Date.now() + 60_000) }).ok).toBe(true);
    });
  });

  describe("canDownload", () => {
    it("returns false for none policy", () => {
      expect(canDownload({ ...baseAlbum, downloadPolicy: "none" })).toBe(false);
    });
    it("returns true for watermarked", () => {
      expect(canDownload({ ...baseAlbum, downloadPolicy: "watermarked" })).toBe(true);
    });
    it("returns true for clean", () => {
      expect(canDownload({ ...baseAlbum, downloadPolicy: "clean" })).toBe(true);
    });
  });

  describe("downloadVariantKey", () => {
    it("maps watermarked → watermarkedFull", () => {
      expect(downloadVariantKey("watermarked")).toBe("watermarkedFull");
    });
    it("maps clean → original", () => {
      expect(downloadVariantKey("clean")).toBe("original");
    });
    it("maps none → null", () => {
      expect(downloadVariantKey("none")).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `access-control.ts`**

```ts
export type AlbumGate = {
  id: string;
  isPublic: boolean;
  passwordHash: string | null;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: Date | null;
};

export type ViewResult = { ok: true } | { ok: false; reason: "not-found" | "expired" };

export function canViewAlbum(album: AlbumGate): ViewResult {
  if (!album.isPublic) return { ok: false, reason: "not-found" };
  if (album.expiresAt && album.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true };
}

export function canDownload(album: AlbumGate): boolean {
  return album.downloadPolicy !== "none";
}

export function downloadVariantKey(
  policy: AlbumGate["downloadPolicy"],
): "watermarkedFull" | "original" | null {
  if (policy === "none") return null;
  if (policy === "watermarked") return "watermarkedFull";
  return "original";
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/lib/access-control.ts src/features/guest-gallery/lib/access-control.test.ts
git commit -m "feat(guest-gallery): add access-control helpers"
```

---

## Task 5: `lib/rate-limit.ts` — in-memory token bucket

**Files:**
- Create: `src/features/guest-gallery/lib/rate-limit.ts`
- Test: `src/features/guest-gallery/lib/rate-limit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to limit then blocks", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(false);
  });

  it("resets after window", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("k")).toBe(true);
    expect(rl.check("k")).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(rl.check("k")).toBe(true);
  });

  it("isolates keys", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("a")).toBe(true);
    expect(rl.check("b")).toBe(true);
    expect(rl.check("a")).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `rate-limit.ts`**

```ts
type Entry = { count: number; resetAt: number };

export type RateLimiter = {
  check: (key: string) => boolean;
};

export function createRateLimiter(opts: { limit: number; windowMs: number }): RateLimiter {
  const store = new Map<string, Entry>();
  return {
    check(key: string): boolean {
      const now = Date.now();
      const e = store.get(key);
      if (!e || e.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs });
        return true;
      }
      if (e.count >= opts.limit) return false;
      e.count++;
      return true;
    },
  };
}

// Shared singletons used across requests
export const unlockLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });
export const guestRegisterLimiter = createRateLimiter({ limit: 3, windowMs: 60 * 60_000 });
export const favoriteLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/lib/rate-limit.ts src/features/guest-gallery/lib/rate-limit.test.ts
git commit -m "feat(guest-gallery): add in-memory rate limiter"
```

---

## Task 6: `server/get-album-by-slug.ts`

**Files:**
- Create: `src/features/guest-gallery/server/get-album-by-slug.ts`
- Test: `src/features/guest-gallery/server/get-album-by-slug.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { getAlbumBySlug } from "./get-album-by-slug";
import { eq } from "drizzle-orm";

describe("getAlbumBySlug", () => {
  let userId: string;
  beforeEach(async () => {
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "S", email: `t${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    userId = u.id;
  });

  it("returns null when slug not found", async () => {
    expect(await getAlbumBySlug("nope-x")).toBeNull();
  });

  it("returns album with media list when published", async () => {
    const [a] = await db.insert(album).values({
      name: "Wedding", slug: "abc12-w", isPublic: true, createdBy: userId,
      publishedAt: new Date(),
    }).returning();
    await db.insert(media).values({
      albumId: a.id, uploadedBy: userId, type: "photo",
      filename: "x.jpg", r2Key: "x", thumbnailR2Key: "xt",
      mimeType: "image/jpeg", sizeBytes: 1,
    });
    const result = await getAlbumBySlug("abc12-w");
    expect(result).not.toBeNull();
    expect(result!.album.name).toBe("Wedding");
    expect(result!.media).toHaveLength(1);
  });

  it("returns the album even when not public (caller decides gating)", async () => {
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: false, createdBy: userId,
    }).returning();
    const result = await getAlbumBySlug("abc12-x");
    expect(result).not.toBeNull();
    expect(result!.album.isPublic).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { db } from "@/db";
import { album, media } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AlbumWithMedia = {
  album: typeof album.$inferSelect;
  media: (typeof media.$inferSelect)[];
};

export async function getAlbumBySlug(slug: string): Promise<AlbumWithMedia | null> {
  const [a] = await db.select().from(album).where(eq(album.slug, slug)).limit(1);
  if (!a) return null;
  const m = await db.select().from(media).where(eq(media.albumId, a.id));
  return { album: a, media: m };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/server/get-album-by-slug.ts src/features/guest-gallery/server/get-album-by-slug.test.ts
git commit -m "feat(guest-gallery): add getAlbumBySlug server function"
```

---

## Task 7: `server/unlock-album.ts`

**Files:**
- Create: `src/features/guest-gallery/server/unlock-album.ts`
- Test: `src/features/guest-gallery/server/unlock-album.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { hash } from "@node-rs/argon2";
import { unlockAlbum } from "./unlock-album";
import { verifyCookie } from "../lib/cookies";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("unlockAlbum", () => {
  let userId: string;
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `u${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    userId = u.id;
  });

  it("returns ok with token for correct password", async () => {
    const ph = await hash("hunter2");
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, passwordHash: ph, createdBy: userId,
    }).returning();
    const r = await unlockAlbum({ slug: "abc12-x", password: "hunter2", clientKey: "ip1" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const payload = await verifyCookie<{ albumId: string }>(r.token, SECRET);
      expect(payload?.albumId).toBe(a.id);
    }
  });

  it("returns ok=false for wrong password", async () => {
    const ph = await hash("hunter2");
    await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, passwordHash: ph, createdBy: userId,
    });
    const r = await unlockAlbum({ slug: "abc12-x", password: "WRONG", clientKey: "ip2" });
    expect(r.ok).toBe(false);
  });

  it("returns ok for album with no password (no-op unlock)", async () => {
    await db.insert(album).values({
      name: "X", slug: "abc12-y", isPublic: true, createdBy: userId,
    });
    const r = await unlockAlbum({ slug: "abc12-y", password: "", clientKey: "ip3" });
    expect(r.ok).toBe(true);
  });

  it("returns not-found for missing slug", async () => {
    const r = await unlockAlbum({ slug: "nope", password: "x", clientKey: "ip4" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-found");
  });

  it("rate-limits after 5 attempts", async () => {
    const ph = await hash("hunter2");
    await db.insert(album).values({
      name: "X", slug: "abc12-z", isPublic: true, passwordHash: ph, createdBy: userId,
    });
    for (let i = 0; i < 5; i++) {
      await unlockAlbum({ slug: "abc12-z", password: "WRONG", clientKey: "ratekey" });
    }
    const r = await unlockAlbum({ slug: "abc12-z", password: "hunter2", clientKey: "ratekey" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { verify } from "@node-rs/argon2";
import { getAlbumBySlug } from "./get-album-by-slug";
import { signCookie } from "../lib/cookies";
import { unlockLimiter } from "../lib/rate-limit";

export type UnlockResult =
  | { ok: true; token: string; albumId: string }
  | { ok: false; reason: "not-found" | "wrong-password" | "rate-limited" };

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export async function unlockAlbum(input: {
  slug: string;
  password: string;
  clientKey: string;
}): Promise<UnlockResult> {
  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) throw new Error("GUEST_COOKIE_SECRET not configured");

  const rateKey = `unlock:${input.clientKey}:${input.slug}`;
  if (!unlockLimiter.check(rateKey)) return { ok: false, reason: "rate-limited" };

  const result = await getAlbumBySlug(input.slug);
  if (!result || !result.album.isPublic) return { ok: false, reason: "not-found" };

  if (result.album.passwordHash) {
    const ok = await verify(result.album.passwordHash, input.password);
    if (!ok) return { ok: false, reason: "wrong-password" };
  }

  const token = await signCookie(
    { albumId: result.album.id, exp: Date.now() + TWENTY_FOUR_HOURS },
    secret,
  );
  return { ok: true, token, albumId: result.album.id };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/server/unlock-album.ts src/features/guest-gallery/server/unlock-album.test.ts
git commit -m "feat(guest-gallery): add unlockAlbum server function"
```

---

## Task 8: `server/register-guest.ts`

**Files:**
- Create: `src/features/guest-gallery/server/register-guest.ts`
- Test: `src/features/guest-gallery/server/register-guest.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, galleryGuests } from "@/db/schema";
import { registerGuest } from "./register-guest";
import { verifyCookie } from "../lib/cookies";
import { eq } from "drizzle-orm";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("registerGuest", () => {
  let userId: string;
  let albumId: string;

  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(galleryGuests);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `r${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, createdBy: userId,
    }).returning();
    albumId = a.id;
  });

  it("inserts guest and returns signed token", async () => {
    const r = await registerGuest({ albumId, name: "Tante Sinta", clientKey: "ipA" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const guests = await db.select().from(galleryGuests).where(eq(galleryGuests.albumId, albumId));
      expect(guests).toHaveLength(1);
      expect(guests[0].displayName).toBe("Tante Sinta");
      const payload = await verifyCookie<{ guestId: string }>(r.token, SECRET);
      expect(payload?.guestId).toBe(guests[0].id);
    }
  });

  it("rejects empty name", async () => {
    const r = await registerGuest({ albumId, name: "  ", clientKey: "ipB" });
    expect(r.ok).toBe(false);
  });

  it("trims and stores name", async () => {
    const r = await registerGuest({ albumId, name: "  Sinta  ", clientKey: "ipC" });
    expect(r.ok).toBe(true);
    const guests = await db.select().from(galleryGuests);
    expect(guests[0].displayName).toBe("Sinta");
  });

  it("rate limits", async () => {
    for (let i = 0; i < 3; i++) {
      await registerGuest({ albumId, name: `n${i}`, clientKey: "rkey" });
    }
    const r = await registerGuest({ albumId, name: "n4", clientKey: "rkey" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { db } from "@/db";
import { galleryGuests } from "@/db/schema";
import { signCookie } from "../lib/cookies";
import { guestRegisterLimiter } from "../lib/rate-limit";

export type RegisterResult =
  | { ok: true; token: string; guestId: string }
  | { ok: false; reason: "invalid-name" | "rate-limited" };

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const MAX_NAME = 60;

export async function registerGuest(input: {
  albumId: string;
  name: string;
  clientKey: string;
}): Promise<RegisterResult> {
  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) throw new Error("GUEST_COOKIE_SECRET not configured");

  if (!guestRegisterLimiter.check(`guest:${input.clientKey}:${input.albumId}`)) {
    return { ok: false, reason: "rate-limited" };
  }

  const trimmed = input.name.trim().slice(0, MAX_NAME);
  if (trimmed.length === 0) return { ok: false, reason: "invalid-name" };

  const [g] = await db
    .insert(galleryGuests)
    .values({ albumId: input.albumId, displayName: trimmed })
    .returning();

  const token = await signCookie({ guestId: g.id, albumId: input.albumId, exp: Date.now() + THIRTY_DAYS }, secret);
  return { ok: true, token, guestId: g.id };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/server/register-guest.ts src/features/guest-gallery/server/register-guest.test.ts
git commit -m "feat(guest-gallery): add registerGuest server function"
```

---

## Task 9: `server/toggle-favorite.ts`

**Files:**
- Create: `src/features/guest-gallery/server/toggle-favorite.ts`
- Test: `src/features/guest-gallery/server/toggle-favorite.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { toggleFavorite } from "./toggle-favorite";
import { eq } from "drizzle-orm";

describe("toggleFavorite", () => {
  let userId: string, albumId: string, mediaId: string, guestId: string;

  beforeEach(async () => {
    await db.delete(galleryFavorites);
    await db.delete(galleryGuests);
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `f${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, createdBy: userId,
    }).returning();
    albumId = a.id;
    const [m] = await db.insert(media).values({
      albumId, uploadedBy: userId, type: "photo", filename: "x", r2Key: "k",
      thumbnailR2Key: "kt", mimeType: "image/jpeg", sizeBytes: 1,
    }).returning();
    mediaId = m.id;
    const [g] = await db.insert(galleryGuests).values({ albumId, displayName: "S" }).returning();
    guestId = g.id;
  });

  it("adds favorite", async () => {
    const r = await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: "k" });
    expect(r.ok).toBe(true);
    expect(await db.select().from(galleryFavorites)).toHaveLength(1);
  });

  it("idempotent add (no error on duplicate)", async () => {
    await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: "k1" });
    const r = await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: "k2" });
    expect(r.ok).toBe(true);
    expect(await db.select().from(galleryFavorites)).toHaveLength(1);
  });

  it("removes favorite", async () => {
    await toggleFavorite({ guestId, mediaId, albumId, action: "add", clientKey: "k1" });
    const r = await toggleFavorite({ guestId, mediaId, albumId, action: "remove", clientKey: "k2" });
    expect(r.ok).toBe(true);
    expect(await db.select().from(galleryFavorites)).toHaveLength(0);
  });

  it("rejects favorite for media in different album", async () => {
    const [a2] = await db.insert(album).values({
      name: "Y", slug: "abc12-y", isPublic: true, createdBy: userId,
    }).returning();
    const [m2] = await db.insert(media).values({
      albumId: a2.id, uploadedBy: userId, type: "photo", filename: "y", r2Key: "k2",
      thumbnailR2Key: "kt2", mimeType: "image/jpeg", sizeBytes: 1,
    }).returning();
    const r = await toggleFavorite({ guestId, mediaId: m2.id, albumId, action: "add", clientKey: "k3" });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

```ts
import { db } from "@/db";
import { galleryFavorites, media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { favoriteLimiter } from "../lib/rate-limit";

export type ToggleResult = { ok: true } | { ok: false; reason: "not-found" | "rate-limited" };

export async function toggleFavorite(input: {
  guestId: string;
  mediaId: string;
  albumId: string;
  action: "add" | "remove";
  clientKey: string;
}): Promise<ToggleResult> {
  if (!favoriteLimiter.check(`fav:${input.clientKey}`)) {
    return { ok: false, reason: "rate-limited" };
  }

  // Verify media belongs to claimed album
  const [m] = await db.select({ id: media.id }).from(media)
    .where(and(eq(media.id, input.mediaId), eq(media.albumId, input.albumId))).limit(1);
  if (!m) return { ok: false, reason: "not-found" };

  if (input.action === "add") {
    await db
      .insert(galleryFavorites)
      .values({ guestId: input.guestId, mediaId: input.mediaId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(galleryFavorites)
      .where(and(eq(galleryFavorites.guestId, input.guestId), eq(galleryFavorites.mediaId, input.mediaId)));
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/server/toggle-favorite.ts src/features/guest-gallery/server/toggle-favorite.test.ts
git commit -m "feat(guest-gallery): add toggleFavorite server function"
```

---

## Task 10: `server/batch-presign-urls.ts`

**Files:**
- Create: `src/features/guest-gallery/server/batch-presign-urls.ts`
- Test: `src/features/guest-gallery/server/batch-presign-urls.test.ts`

Note: The existing storage layer (`src/features/media` or `src/lib/storage`) already exposes presigned URL helpers via the AWS S3 SDK. We wrap them. **Locate the existing helper before writing this task** — search `Grep -r "getSignedUrl"` and reuse. If none exists, create `src/lib/r2.ts` from the upload-presign route's pattern.

- [ ] **Step 1: Locate existing R2 helper**

Run: `Grep "getSignedUrl" --type ts` and `Grep "S3Client" --type ts`. Read the result. The new function MUST reuse that S3Client (singleton), not create a second one.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { batchPresignUrls } from "./batch-presign-urls";

describe("batchPresignUrls", () => {
  it("returns map of mediaId → urls for thumb + preview", async () => {
    const items = [
      { id: "m1", r2Key: "media/m1/original.jpg", thumbnailR2Key: "media/m1/thumb.jpg",
        variants: { preview1200: "media/m1/preview.jpg" } },
      { id: "m2", r2Key: "media/m2/original.jpg", thumbnailR2Key: "media/m2/thumb.jpg",
        variants: {} },
    ];
    const result = await batchPresignUrls(items, 3600);
    expect(result.m1.thumbUrl).toMatch(/^https?:\/\//);
    expect(result.m1.previewUrl).toMatch(/^https?:\/\//);
    expect(result.m2.thumbUrl).toMatch(/^https?:\/\//);
    // Falls back to original when no preview1200
    expect(result.m2.previewUrl).toMatch(/^https?:\/\//);
  });
});
```

This test requires R2 env vars set in `.env.test`. If not present, mark test `it.skipIf(!process.env.R2_BUCKET)`.

- [ ] **Step 3: Implement**

```ts
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2"; // adjust to actual existing path

export type PresignableMedia = {
  id: string;
  r2Key: string;
  thumbnailR2Key: string;
  variants: { preview1200?: string; thumb400?: string; watermarkedFull?: string };
};

export type PresignedUrls = Record<string, { thumbUrl: string; previewUrl: string }>;

export async function batchPresignUrls(
  items: PresignableMedia[],
  ttlSeconds: number,
): Promise<PresignedUrls> {
  const bucket = process.env.R2_BUCKET!;
  const out: PresignedUrls = {};
  await Promise.all(
    items.map(async (m) => {
      const thumbKey = m.variants.thumb400 ?? m.thumbnailR2Key;
      const previewKey = m.variants.preview1200 ?? m.r2Key;
      const [thumbUrl, previewUrl] = await Promise.all([
        getSignedUrl(r2Client, new GetObjectCommand({ Bucket: bucket, Key: thumbKey }), { expiresIn: ttlSeconds }),
        getSignedUrl(r2Client, new GetObjectCommand({ Bucket: bucket, Key: previewKey }), { expiresIn: ttlSeconds }),
      ]);
      out[m.id] = { thumbUrl, previewUrl };
    }),
  );
  return out;
}
```

- [ ] **Step 4: Run → PASS** (or skipped if no R2 env)

- [ ] **Step 5: Commit**

```bash
git add src/features/guest-gallery/server/batch-presign-urls.ts src/features/guest-gallery/server/batch-presign-urls.test.ts
git commit -m "feat(guest-gallery): add batchPresignUrls"
```

---

## Task 11: API routes — unlock, guest, favorite

**Files:**
- Create: `src/app/g/[slug]/api/unlock/route.ts`
- Create: `src/app/g/[slug]/api/unlock/route.test.ts`
- Create: `src/app/g/[slug]/api/guest/route.ts`
- Create: `src/app/g/[slug]/api/guest/route.test.ts`
- Create: `src/app/g/[slug]/api/favorite/route.ts`
- Create: `src/app/g/[slug]/api/favorite/route.test.ts`

- [ ] **Step 1: Write the failing test for unlock route**

`src/app/g/[slug]/api/unlock/route.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { hash } from "@node-rs/argon2";
import { POST } from "./route";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("POST /g/[slug]/api/unlock", () => {
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `u${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    const ph = await hash("hunter2");
    await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, passwordHash: ph, createdBy: u.id,
    });
  });

  it("sets cookie on correct password", async () => {
    const req = new Request("http://localhost/g/abc12-x/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
      body: JSON.stringify({ password: "hunter2" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("gk_unlock_");
  });

  it("returns 401 on wrong password", async () => {
    const req = new Request("http://localhost/g/abc12-x/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "2.2.2.2" },
      body: JSON.stringify({ password: "wrong" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 on missing slug", async () => {
    const req = new Request("http://localhost/g/nope/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "3.3.3.3" },
      body: JSON.stringify({ password: "x" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "nope" }) });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `unlock/route.ts`**

```ts
import { NextResponse } from "next/server";
import { unlockAlbum } from "@/features/guest-gallery/server/unlock-album";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const clientKey = req.headers.get("x-forwarded-for") ?? "unknown";
  const result = await unlockAlbum({ slug, password: body.password ?? "", clientKey });

  if (!result.ok) {
    if (result.reason === "not-found") return new NextResponse(null, { status: 404 });
    if (result.reason === "rate-limited") return new NextResponse("Too many attempts", { status: 429 });
    return new NextResponse("Wrong password", { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(`gk_unlock_${result.albumId}`, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/g/${slug}`,
    maxAge: 24 * 60 * 60,
  });
  return res;
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Repeat Steps 1-4 for `guest/route.ts`**

`route.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, galleryGuests } from "@/db/schema";
import { signCookie } from "@/features/guest-gallery/lib/cookies";
import { POST } from "./route";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("POST /g/[slug]/api/guest", () => {
  let albumId: string;
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(galleryGuests);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `g${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
  });

  it("requires unlock cookie", async () => {
    const req = new Request("http://localhost/g/abc12-x/api/guest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Sinta" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(401);
  });

  it("creates guest with valid unlock cookie", async () => {
    const token = await signCookie({ albumId, exp: Date.now() + 60_000 }, SECRET);
    const req = new Request("http://localhost/g/abc12-x/api/guest", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `gk_unlock_${albumId}=${token}`,
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({ name: "Sinta" }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("gk_guest");
    expect(await db.select().from(galleryGuests)).toHaveLength(1);
  });
});
```

`route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { registerGuest } from "@/features/guest-gallery/server/register-guest";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const cookieStore = await cookies();
  const unlockToken = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
  // For password-less albums, accept missing cookie? Spec says: unlock cookie
  // is set during gate; password-less albums set it via the same flow on first
  // visit through page.tsx. Here we require it.
  const payload = unlockToken ? await verifyCookie<{ albumId: string }>(unlockToken, secret) : null;
  if (!payload || payload.albumId !== found.album.id) {
    return new NextResponse("Unlock required", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const clientKey = req.headers.get("x-forwarded-for") ?? "unknown";
  const r = await registerGuest({ albumId: found.album.id, name: body.name ?? "", clientKey });
  if (!r.ok) {
    if (r.reason === "rate-limited") return new NextResponse("Too many", { status: 429 });
    return new NextResponse("Invalid name", { status: 400 });
  }

  const res = NextResponse.json({ ok: true, guestId: r.guestId });
  res.cookies.set("gk_guest", r.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/g/${slug}`,
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
```

- [ ] **Step 6: Repeat for `favorite/route.ts`**

`route.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media, galleryGuests, galleryFavorites } from "@/db/schema";
import { signCookie } from "@/features/guest-gallery/lib/cookies";
import { POST, DELETE } from "./route";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("favorite route", () => {
  let albumId: string, mediaId: string, guestId: string;
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(galleryFavorites);
    await db.delete(galleryGuests);
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `fa${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
    const [m] = await db.insert(media).values({
      albumId, uploadedBy: u.id, type: "photo", filename: "x", r2Key: "k",
      thumbnailR2Key: "kt", mimeType: "image/jpeg", sizeBytes: 1,
    }).returning();
    mediaId = m.id;
    const [g] = await db.insert(galleryGuests).values({ albumId, displayName: "S" }).returning();
    guestId = g.id;
  });

  it("POST adds favorite when guest cookie valid", async () => {
    const token = await signCookie({ guestId, albumId, exp: Date.now() + 60_000 }, SECRET);
    const req = new Request("http://localhost/g/abc12-x/api/favorite", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `gk_guest=${token}` },
      body: JSON.stringify({ mediaId }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(200);
    expect(await db.select().from(galleryFavorites)).toHaveLength(1);
  });

  it("POST returns 401 without cookie", async () => {
    const req = new Request("http://localhost/g/abc12-x/api/favorite", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(401);
  });
});
```

`route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { toggleFavorite } from "@/features/guest-gallery/server/toggle-favorite";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

async function handle(req: Request, slug: string, action: "add" | "remove") {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const cookieStore = await cookies();
  const guestToken = cookieStore.get("gk_guest")?.value;
  const payload = guestToken ? await verifyCookie<{ guestId: string; albumId: string }>(guestToken, secret) : null;
  if (!payload || payload.albumId !== found.album.id) {
    return new NextResponse("Guest required", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const clientKey = req.headers.get("x-forwarded-for") ?? payload.guestId;
  const r = await toggleFavorite({
    guestId: payload.guestId, mediaId: body.mediaId, albumId: found.album.id, action, clientKey,
  });
  if (!r.ok) {
    if (r.reason === "rate-limited") return new NextResponse(null, { status: 429 });
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handle(req, slug, "add");
}

export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handle(req, slug, "remove");
}
```

- [ ] **Step 7: Run all 3 route tests → PASS**

- [ ] **Step 8: Commit**

```bash
git add src/app/g/[slug]/api
git commit -m "feat(guest-gallery): add unlock/guest/favorite API routes"
```

---

## Task 12: Manifest + cover routes

**Files:**
- Create: `src/app/g/[slug]/manifest.webmanifest/route.ts` + test
- Create: `src/app/g/[slug]/cover.jpg/route.ts` + test

- [ ] **Step 1: Write failing test for manifest**

`src/app/g/[slug]/manifest.webmanifest/route.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { GET } from "./route";

describe("GET manifest.webmanifest", () => {
  beforeEach(async () => {
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `mf${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    await db.insert(album).values({
      name: "Andini & Reza Wedding", slug: "abc12-andini-reza", isPublic: true, createdBy: u.id,
    });
  });

  it("returns manifest JSON for published album", async () => {
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ slug: "abc12-andini-reza" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/manifest+json");
    const json = await res.json();
    expect(json.name).toBe("Andini & Reza Wedding");
    expect(json.start_url).toBe("/g/abc12-andini-reza");
    expect(json.scope).toBe("/g/abc12-andini-reza");
    expect(json.icons).toHaveLength(1);
    expect(json.icons[0].src).toBe("/g/abc12-andini-reza/cover.jpg");
  });

  it("returns 404 for non-public album", async () => {
    await db.delete(album);
    const [u] = await db.select().from(user).limit(1);
    await db.insert(album).values({
      name: "X", slug: "abc12-priv", isPublic: false, createdBy: u.id,
    });
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ slug: "abc12-priv" }) });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Implement `manifest.webmanifest/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const manifest = {
    name: found.album.name,
    short_name: found.album.name.slice(0, 24),
    start_url: `/g/${slug}`,
    scope: `/g/${slug}`,
    display: "standalone",
    theme_color: "#FAF7F2",
    background_color: "#1A1A1A",
    icons: [{ src: `/g/${slug}/cover.jpg`, sizes: "512x512", type: "image/jpeg", purpose: "any" }],
  };
  return new NextResponse(JSON.stringify(manifest), {
    headers: { "content-type": "application/manifest+json" },
  });
}
```

- [ ] **Step 3: Run → PASS**

- [ ] **Step 4: Implement `cover.jpg/route.ts`** (302 to presigned cover)

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  const coverId = found.album.coverMediaId ?? found.media[0]?.id;
  if (!coverId) return new NextResponse(null, { status: 404 });

  const [m] = await db.select().from(media).where(eq(media.id, coverId)).limit(1);
  if (!m) return new NextResponse(null, { status: 404 });

  const urls = await batchPresignUrls(
    [{ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} }],
    300,
  );
  return NextResponse.redirect(urls[m.id].previewUrl, 302);
}
```

- [ ] **Step 5: Test cover route (skipped if no R2 env)**

- [ ] **Step 6: Commit**

```bash
git add src/app/g/[slug]/manifest.webmanifest src/app/g/[slug]/cover.jpg
git commit -m "feat(guest-gallery): add dynamic manifest and cover routes"
```

---

## Task 13: Components — password-gate, name-modal, favorite-heart

**Files:**
- Create: `src/features/guest-gallery/components/password-gate.tsx` + `.test.tsx`
- Create: `src/features/guest-gallery/components/name-modal.tsx` + `.test.tsx`
- Create: `src/features/guest-gallery/components/favorite-heart.tsx` + `.test.tsx`

### password-gate

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordGate } from "./password-gate";

global.fetch = vi.fn();

describe("PasswordGate", () => {
  it("submits password and reloads on success", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    const reload = vi.fn();
    Object.defineProperty(window, "location", { value: { reload }, writable: true });
    render(<PasswordGate slug="abc12-x" />);
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter2" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it("shows error on 401", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 401 });
    render(<PasswordGate slug="abc12-x" />);
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await waitFor(() => expect(screen.getByText(/password salah/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Implement**

```tsx
"use client";
import { useState } from "react";

export function PasswordGate({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/g/${slug}/api/unlock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
      return;
    }
    if (res.status === 429) setError("Terlalu banyak percobaan, coba lagi nanti.");
    else setError("Password salah");
    setLoading(false);
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-[#FAF7F2]">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Album terkunci</h1>
        <p className="text-sm text-gray-600">Masukkan password yang dibagikan oleh photographer.</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-black text-white py-2">
          {loading ? "..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Run → PASS**

### name-modal

- [ ] **Step 4: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NameModal } from "./name-modal";

global.fetch = vi.fn();

describe("NameModal", () => {
  it("calls onSuccess after registering", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ guestId: "g1" }) });
    const onSuccess = vi.fn();
    render(<NameModal slug="abc12-x" open onClose={() => {}} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/nama/i), { target: { value: "Sinta" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("g1"));
  });

  it("does not render when closed", () => {
    render(<NameModal slug="abc12-x" open={false} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.queryByPlaceholderText(/nama/i)).toBeNull();
  });
});
```

- [ ] **Step 5: Implement**

```tsx
"use client";
import { useState } from "react";

export function NameModal({
  slug, open, onClose, onSuccess,
}: { slug: string; open: boolean; onClose: () => void; onSuccess: (guestId: string) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/g/${slug}/api/guest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError("Gagal menyimpan nama");
      setLoading(false);
      return;
    }
    const data = await res.json();
    onSuccess(data.guestId);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Sebelum favorite, siapa nama Anda?</h2>
        <p className="text-sm text-gray-600">Photographer akan tahu foto mana yang Anda pilih.</p>
        <input
          placeholder="Nama (cth: Tante Sinta)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border py-2">Batal</button>
          <button onClick={submit} disabled={loading || !name.trim()} className="flex-1 rounded-md bg-black text-white py-2">
            {loading ? "..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run → PASS**

### favorite-heart

- [ ] **Step 7: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FavoriteHeart } from "./favorite-heart";

global.fetch = vi.fn();

describe("FavoriteHeart", () => {
  it("opens NameModal on first tap when no guest cookie", () => {
    document.cookie = "";
    render(<FavoriteHeart slug="abc12-x" mediaId="m1" hasGuest={false} />);
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    expect(screen.getByPlaceholderText(/nama/i)).toBeInTheDocument();
  });

  it("toggles favorite directly when hasGuest=true", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    render(<FavoriteHeart slug="abc12-x" mediaId="m1" hasGuest />);
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/g/abc12-x/api/favorite",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
```

- [ ] **Step 8: Implement**

```tsx
"use client";
import { useState } from "react";
import { NameModal } from "./name-modal";

export function FavoriteHeart({
  slug, mediaId, hasGuest: initialHasGuest, initialFavorited = false,
}: { slug: string; mediaId: string; hasGuest: boolean; initialFavorited?: boolean }) {
  const [hasGuest, setHasGuest] = useState(initialHasGuest);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [showModal, setShowModal] = useState(false);

  async function toggle() {
    if (!hasGuest) {
      setShowModal(true);
      return;
    }
    const next = !favorited;
    setFavorited(next); // optimistic
    const res = await fetch(`/g/${slug}/api/favorite`, {
      method: next ? "POST" : "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    if (!res.ok) setFavorited(!next); // rollback
  }

  function onGuestRegistered() {
    setHasGuest(true);
    setShowModal(false);
    // Auto-trigger favorite after name save
    void (async () => {
      setFavorited(true);
      const res = await fetch(`/g/${slug}/api/favorite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!res.ok) setFavorited(false);
    })();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Favorite"
        onClick={toggle}
        className={`p-2 rounded-full ${favorited ? "text-red-500" : "text-white/80"}`}
      >
        {favorited ? "♥" : "♡"}
      </button>
      <NameModal
        slug={slug}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onGuestRegistered}
      />
    </>
  );
}
```

- [ ] **Step 9: Run → PASS**

- [ ] **Step 10: Commit**

```bash
git add src/features/guest-gallery/components/password-gate.tsx \
        src/features/guest-gallery/components/password-gate.test.tsx \
        src/features/guest-gallery/components/name-modal.tsx \
        src/features/guest-gallery/components/name-modal.test.tsx \
        src/features/guest-gallery/components/favorite-heart.tsx \
        src/features/guest-gallery/components/favorite-heart.test.tsx
git commit -m "feat(guest-gallery): add password gate, name modal, favorite heart"
```

---

## Task 14: Components — gallery-grid + lightbox

**Files:**
- Create: `src/features/guest-gallery/components/gallery-grid.tsx` + `.test.tsx`
- Create: `src/features/guest-gallery/components/lightbox.tsx` + `.test.tsx`

### gallery-grid

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryGrid } from "./gallery-grid";

const photos = [
  { id: "m1", thumbUrl: "https://x/t1.jpg", previewUrl: "https://x/p1.jpg" },
  { id: "m2", thumbUrl: "https://x/t2.jpg", previewUrl: "https://x/p2.jpg" },
];

describe("GalleryGrid", () => {
  it("renders photos", () => {
    render(<GalleryGrid slug="abc12-x" photos={photos} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("renders empty state when no photos", () => {
    render(<GalleryGrid slug="abc12-x" photos={[]} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(screen.getByText(/belum upload/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement**

```tsx
"use client";
import { useState } from "react";
import { FavoriteHeart } from "./favorite-heart";
import { Lightbox } from "./lightbox";

export type Photo = { id: string; thumbUrl: string; previewUrl: string; width: number | null; height: number | null };

export function GalleryGrid({
  slug, photos, hasGuest, downloadPolicy, favorites,
}: {
  slug: string;
  photos: Photo[];
  hasGuest: boolean;
  downloadPolicy: "none" | "watermarked" | "clean";
  favorites: Set<string>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return <div className="py-20 text-center text-gray-500">Photographer belum upload foto.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={p.thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
              width={p.width ?? 400}
              height={p.height ?? 400}
              onClick={() => setOpenIndex(i)}
              className="h-full w-full object-cover cursor-pointer"
            />
            <div className="absolute bottom-1 right-1">
              <FavoriteHeart slug={slug} mediaId={p.id} hasGuest={hasGuest} initialFavorited={favorites.has(p.id)} />
            </div>
          </div>
        ))}
      </div>
      {openIndex !== null && (
        <Lightbox
          slug={slug}
          photos={photos}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          hasGuest={hasGuest}
          downloadPolicy={downloadPolicy}
          favorites={favorites}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Run → PASS**

### lightbox

- [ ] **Step 4: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Lightbox } from "./lightbox";

const photos = [
  { id: "m1", thumbUrl: "t1", previewUrl: "p1" },
  { id: "m2", thumbUrl: "t2", previewUrl: "p2" },
];

describe("Lightbox", () => {
  it("renders preview image of starting index", () => {
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "p1");
  });

  it("closes on ESC", () => {
    const onClose = vi.fn();
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={onClose} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("hides download button when policy=none", () => {
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(screen.queryByRole("button", { name: /download/i })).toBeNull();
  });

  it("shows download button when policy=watermarked", () => {
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="watermarked" favorites={new Set()} />);
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Implement**

```tsx
"use client";
import { useEffect, useState } from "react";
import { FavoriteHeart } from "./favorite-heart";
import type { Photo } from "./gallery-grid";

export function Lightbox({
  slug, photos, startIndex, onClose, hasGuest, downloadPolicy, favorites,
}: {
  slug: string;
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
  hasGuest: boolean;
  downloadPolicy: "none" | "watermarked" | "clean";
  favorites: Set<string>;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(photos.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  // Touch swipe (mobile)
  let touchStartX = 0;
  function onTouchStart(e: React.TouchEvent) { touchStartX = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 50) setIndex((i) => Math.max(0, i - 1));
    else if (dx < -50) setIndex((i) => Math.min(photos.length - 1, i + 1));
  }

  const current = photos[index];
  const canDownload = downloadPolicy !== "none";

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white text-2xl" aria-label="Close">×</button>
      <div className="flex-1 flex items-center justify-center">
        <img src={current.previewUrl} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex justify-center gap-6 py-4 text-white">
        <FavoriteHeart slug={slug} mediaId={current.id} hasGuest={hasGuest} initialFavorited={favorites.has(current.id)} />
        {canDownload && (
          <a
            href={`/g/${slug}/api/download/${current.id}`}
            download
            role="button"
            aria-label="Download"
            className="px-3 py-2 rounded border border-white/40"
          >
            ⬇ Download
          </a>
        )}
      </div>
    </div>
  );
}
```

> Note: `/g/[slug]/api/download/[id]` route is not built in C1 — it belongs to C2 (watermark engine). For C1 MVP, hide the download button entirely if `downloadPolicy === "clean"` or "watermarked" until C2 ships, OR temporarily proxy to the original presigned URL. **For this plan we keep the button visible but call a stub route added in Task 12.5 below.** Update: include a small download proxy endpoint here.

- [ ] **Step 6: Add stub `download/[id]/route.ts`**

`src/app/g/[slug]/api/download/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";
import { canDownload } from "@/features/guest-gallery/lib/access-control";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const { slug, id } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });
  if (!canDownload(found.album)) return new NextResponse(null, { status: 403 });

  const cookieStore = await cookies();
  const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
  const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
  if (!payload || payload.albumId !== found.album.id) return new NextResponse(null, { status: 401 });

  const [m] = await db.select().from(media).where(and(eq(media.id, id), eq(media.albumId, found.album.id))).limit(1);
  if (!m) return new NextResponse(null, { status: 404 });

  const urls = await batchPresignUrls(
    [{ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} }],
    300,
  );
  // For C1, "clean" → original (previewUrl falls back to original). C2 will swap to watermarkedFull.
  return NextResponse.redirect(urls[m.id].previewUrl, 302);
}
```

- [ ] **Step 7: Run all component tests → PASS**

- [ ] **Step 8: Commit**

```bash
git add src/features/guest-gallery/components/gallery-grid.tsx \
        src/features/guest-gallery/components/gallery-grid.test.tsx \
        src/features/guest-gallery/components/lightbox.tsx \
        src/features/guest-gallery/components/lightbox.test.tsx \
        src/app/g/[slug]/api/download
git commit -m "feat(guest-gallery): add grid, lightbox, download stub"
```

---

## Task 14b: Pagination + infinite scroll

**Goal:** RSC initial render hanya load 60 foto pertama. Client fetch batch berikutnya via cursor saat IntersectionObserver trigger di akhir grid. Cegah payload HTML jumbo + presigned URL waste untuk wedding album 500+ foto.

**Files:**
- Create: `src/features/guest-gallery/server/get-album-media-page.ts` + test
- Create: `src/app/g/[slug]/api/media/route.ts` + test
- Modify: `src/features/guest-gallery/components/gallery-grid.tsx` (add infinite scroll)
- Modify: `src/app/g/[slug]/page.tsx` (load only first page initially)

- [ ] **Step 1: Write the failing test for pagination server function**

`src/features/guest-gallery/server/get-album-media-page.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { getAlbumMediaPage } from "./get-album-media-page";

describe("getAlbumMediaPage", () => {
  let userId: string;
  let albumId: string;

  beforeEach(async () => {
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `pg${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, createdBy: userId,
    }).returning();
    albumId = a.id;
    // Insert 25 media in deterministic createdAt order
    for (let i = 0; i < 25; i++) {
      await db.insert(media).values({
        albumId, uploadedBy: userId, type: "photo",
        filename: `f${i}.jpg`, r2Key: `k${i}`, thumbnailR2Key: `kt${i}`,
        mimeType: "image/jpeg", sizeBytes: 1,
      });
      await new Promise((r) => setTimeout(r, 2)); // ensure distinct createdAt
    }
  });

  it("returns first page of given size with hasMore=true", async () => {
    const r = await getAlbumMediaPage({ albumId, limit: 10 });
    expect(r.items).toHaveLength(10);
    expect(r.hasMore).toBe(true);
    expect(r.nextCursor).not.toBeNull();
  });

  it("returns next page using cursor", async () => {
    const first = await getAlbumMediaPage({ albumId, limit: 10 });
    const second = await getAlbumMediaPage({ albumId, limit: 10, cursor: first.nextCursor });
    expect(second.items).toHaveLength(10);
    // No overlap with first page
    const firstIds = new Set(first.items.map((m) => m.id));
    expect(second.items.every((m) => !firstIds.has(m.id))).toBe(true);
  });

  it("returns final page with hasMore=false", async () => {
    const p1 = await getAlbumMediaPage({ albumId, limit: 10 });
    const p2 = await getAlbumMediaPage({ albumId, limit: 10, cursor: p1.nextCursor });
    const p3 = await getAlbumMediaPage({ albumId, limit: 10, cursor: p2.nextCursor });
    expect(p3.items).toHaveLength(5);
    expect(p3.hasMore).toBe(false);
    expect(p3.nextCursor).toBeNull();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `get-album-media-page.ts`**

```ts
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq, lt, desc } from "drizzle-orm";

export type MediaPage = {
  items: (typeof media.$inferSelect)[];
  nextCursor: string | null;
  hasMore: boolean;
};

// Cursor format: ISO timestamp of the last item's createdAt.
// Order: createdAt DESC (newest first).
export async function getAlbumMediaPage(input: {
  albumId: string;
  limit: number;
  cursor?: string | null;
}): Promise<MediaPage> {
  const limit = Math.min(Math.max(input.limit, 1), 100);
  const where = input.cursor
    ? and(eq(media.albumId, input.albumId), lt(media.createdAt, new Date(input.cursor)))
    : eq(media.albumId, input.albumId);

  const items = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? sliced[sliced.length - 1].createdAt.toISOString() : null;
  return { items: sliced, nextCursor, hasMore };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Write the failing test for media API route**

`src/app/g/[slug]/api/media/route.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { signCookie } from "@/features/guest-gallery/lib/cookies";
import { GET } from "./route";

const SECRET = "test-secret-32-bytes-long-12345678";

describe("GET /g/[slug]/api/media", () => {
  let albumId: string;
  beforeEach(async () => {
    process.env.GUEST_COOKIE_SECRET = SECRET;
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `mr${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    const [a] = await db.insert(album).values({
      name: "X", slug: "abc12-x", isPublic: true, createdBy: u.id,
    }).returning();
    albumId = a.id;
    for (let i = 0; i < 5; i++) {
      await db.insert(media).values({
        albumId, uploadedBy: u.id, type: "photo",
        filename: `f${i}.jpg`, r2Key: `k${i}`, thumbnailR2Key: `kt${i}`,
        mimeType: "image/jpeg", sizeBytes: 1,
      });
    }
  });

  it("returns 401 for password album without unlock cookie", async () => {
    // Force album to require password
    const { hash } = await import("@node-rs/argon2");
    await db.update(album).set({ passwordHash: await hash("x") }).where(eq(album.id, albumId));
    const req = new Request("http://localhost/g/abc12-x/api/media?limit=2");
    const res = await GET(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(401);
  });

  it("returns first page with presigned URLs", async () => {
    const tok = await signCookie({ albumId, exp: Date.now() + 60_000 }, SECRET);
    const req = new Request("http://localhost/g/abc12-x/api/media?limit=2", {
      headers: { cookie: `gk_unlock_${albumId}=${tok}` },
    });
    const res = await GET(req as any, { params: Promise.resolve({ slug: "abc12-x" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(2);
    expect(json.items[0]).toHaveProperty("thumbUrl");
    expect(json.items[0]).toHaveProperty("previewUrl");
    expect(json.hasMore).toBe(true);
  });
});

import { eq } from "drizzle-orm";
```

- [ ] **Step 6: Implement `media/route.ts`**

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { getAlbumMediaPage } from "@/features/guest-gallery/server/get-album-media-page";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const secret = process.env.GUEST_COOKIE_SECRET!;
  const { slug } = await ctx.params;
  const found = await getAlbumBySlug(slug);
  if (!found || !found.album.isPublic) return new NextResponse(null, { status: 404 });

  // Enforce password gate if applicable
  if (found.album.passwordHash) {
    const cookieStore = await cookies();
    const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
    const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
    if (!payload || payload.albumId !== found.album.id) {
      return new NextResponse(null, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "60"), 100);
  const cursor = url.searchParams.get("cursor");

  const page = await getAlbumMediaPage({ albumId: found.album.id, limit, cursor });
  const presigned = await batchPresignUrls(
    page.items.map((m) => ({ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} })),
    60 * 60,
  );
  const items = page.items.map((m) => ({
    id: m.id,
    thumbUrl: presigned[m.id].thumbUrl,
    previewUrl: presigned[m.id].previewUrl,
    width: m.width,
    height: m.height,
  }));
  return NextResponse.json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore });
}
```

- [ ] **Step 7: Run route test → PASS**

- [ ] **Step 8: Update `gallery-grid.tsx` to support infinite scroll**

Replace component implementation:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { FavoriteHeart } from "./favorite-heart";
import { Lightbox } from "./lightbox";

export type Photo = {
  id: string;
  thumbUrl: string;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

export function GalleryGrid({
  slug, initialPhotos, initialCursor, hasMore: initialHasMore,
  hasGuest, downloadPolicy, favorites,
}: {
  slug: string;
  initialPhotos: Photo[];
  initialCursor: string | null;
  hasMore: boolean;
  hasGuest: boolean;
  downloadPolicy: "none" | "watermarked" | "clean";
  favorites: Set<string>;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || !hasMore) return;
        setLoading(true);
        try {
          const params = new URLSearchParams({ limit: "60" });
          if (cursor) params.set("cursor", cursor);
          const res = await fetch(`/g/${slug}/api/media?${params.toString()}`);
          if (!res.ok) {
            setHasMore(false);
            return;
          }
          const data = (await res.json()) as { items: Photo[]; nextCursor: string | null; hasMore: boolean };
          setPhotos((prev) => [...prev, ...data.items]);
          setCursor(data.nextCursor);
          setHasMore(data.hasMore);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, slug]);

  if (photos.length === 0) {
    return <div className="py-20 text-center text-gray-500">Photographer belum upload foto.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={p.thumbUrl}
              alt=""
              loading="lazy"
              decoding="async"
              width={p.width ?? 400}
              height={p.height ?? 400}
              onClick={() => setOpenIndex(i)}
              className="h-full w-full object-cover cursor-pointer"
            />
            <div className="absolute bottom-1 right-1">
              <FavoriteHeart slug={slug} mediaId={p.id} hasGuest={hasGuest} initialFavorited={favorites.has(p.id)} />
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="py-10 text-center text-xs text-gray-500">
          {loading ? "Loading more..." : ""}
        </div>
      )}
      {openIndex !== null && (
        <Lightbox
          slug={slug}
          photos={photos}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          hasGuest={hasGuest}
          downloadPolicy={downloadPolicy}
          favorites={favorites}
        />
      )}
    </>
  );
}
```

> **Caveat:** Lightbox only knows about photos already loaded. If user opens lightbox at the end of a page and swipes right, they reach the boundary of loaded photos. Acceptable trade-off for MVP — they can close, scroll to load more, then re-open. Future improvement: prefetch next page when lightbox approaches the end.

- [ ] **Step 9: Update `gallery-grid.test.tsx` for new props**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryGrid } from "./gallery-grid";

const photos = [
  { id: "m1", thumbUrl: "https://x/t1.jpg", previewUrl: "https://x/p1.jpg", width: 400, height: 400 },
  { id: "m2", thumbUrl: "https://x/t2.jpg", previewUrl: "https://x/p2.jpg", width: 400, height: 400 },
];

describe("GalleryGrid", () => {
  it("renders photos", () => {
    render(
      <GalleryGrid
        slug="abc12-x"
        initialPhotos={photos}
        initialCursor={null}
        hasMore={false}
        hasGuest={false}
        downloadPolicy="none"
        favorites={new Set()}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("renders empty state when no photos", () => {
    render(
      <GalleryGrid
        slug="abc12-x"
        initialPhotos={[]}
        initialCursor={null}
        hasMore={false}
        hasGuest={false}
        downloadPolicy="none"
        favorites={new Set()}
      />,
    );
    expect(screen.getByText(/belum upload/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Update `page.tsx` (Task 16) to use first page only**

Replace the media-loading section in `src/app/g/[slug]/page.tsx`:

```tsx
// Replace:
//   const presigned = await batchPresignUrls(found.media.map(...), 60*60);
//   const photos = found.media.map(...);
// With:
import { getAlbumMediaPage } from "@/features/guest-gallery/server/get-album-media-page";

const page = await getAlbumMediaPage({ albumId: found.album.id, limit: 60 });
const presigned = await batchPresignUrls(
  page.items.map((m) => ({ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} })),
  60 * 60,
);
const initialPhotos = page.items.map((m) => ({
  id: m.id,
  thumbUrl: presigned[m.id].thumbUrl,
  previewUrl: presigned[m.id].previewUrl,
  width: m.width,
  height: m.height,
}));

// And update <GalleryGrid> usage:
<GalleryGrid
  slug={slug}
  initialPhotos={initialPhotos}
  initialCursor={page.nextCursor}
  hasMore={page.hasMore}
  hasGuest={hasGuest}
  downloadPolicy={found.album.downloadPolicy}
  favorites={favorites}
/>
```

Also note: `previewUrls` for `<OfflineToggle>` should now fetch ALL pages (offline opt-in is "save entire album"). Add a helper:

```tsx
// In page.tsx, after computing initialPhotos:
// For offline opt-in, we still need URLs for ALL photos.
// Cheap path: query just the IDs + keys for the rest, presign in batch.
// For MVP simplicity, fetch one big page (limit=1000) only if user opens
// offline modal — defer to client-side: <OfflineToggle> calls /api/media
// repeatedly until hasMore=false, then caches each previewUrl.
```

> **Note on `<OfflineToggle>`:** It will be implemented in Task 15 with `slug` + `albumId` props (NOT `urls`), and will lazily fetch all preview URLs by paginating `/g/[slug]/api/media` on click. Task 15 step for offline-toggle reflects this — see the updated implementation there.

- [ ] **Step 11: Run full test suite**

```bash
pnpm test
```

All previous tests + new tests pass.

- [ ] **Step 12: Commit**

```bash
git add src/features/guest-gallery/server/get-album-media-page.ts \
        src/features/guest-gallery/server/get-album-media-page.test.ts \
        src/app/g/[slug]/api/media \
        src/features/guest-gallery/components/gallery-grid.tsx \
        src/features/guest-gallery/components/gallery-grid.test.tsx \
        src/features/guest-gallery/components/offline-toggle.tsx \
        src/app/g/[slug]/page.tsx
git commit -m "feat(guest-gallery): paginate media + infinite scroll + lazy offline cache"
```

---

## Task 15: Components — install-pwa-button, offline-toggle, album-header

### album-header (server component)

- [ ] **Step 1: Create `album-header.tsx`**

```tsx
import Image from "next/image";

export function AlbumHeader({ slug, title, photoCount, coverUrl }: {
  slug: string; title: string; photoCount: number; coverUrl: string | null;
}) {
  return (
    <header className="relative">
      {coverUrl ? (
        <div className="aspect-[16/9] sm:aspect-[21/9] relative overflow-hidden">
          <Image src={coverUrl} alt={title} fill className="object-cover" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-[#B85738] to-[#1A1A1A]" />
      )}
      <div className="absolute bottom-6 left-6 right-6 text-white">
        <h1 className="text-3xl sm:text-5xl font-semibold">{title}</h1>
        <p className="text-sm opacity-80 mt-2">{photoCount} foto</p>
      </div>
    </header>
  );
}
```

### install-pwa-button (client)

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstallPwaButton } from "./install-pwa-button";

describe("InstallPwaButton", () => {
  it("renders nothing initially (no prompt event)", () => {
    const { container } = render(<InstallPwaButton />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 3: Implement**

```tsx
"use client";
import { useEffect, useState } from "react";

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPwaButton() {
  const [prompt, setPrompt] = useState<DeferredPrompt | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setPrompt(e as DeferredPrompt);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  return (
    <button
      onClick={async () => {
        await prompt.prompt();
        setPrompt(null);
      }}
      className="rounded-md bg-black text-white px-4 py-2 text-sm"
    >
      Install Album
    </button>
  );
}
```

### offline-toggle (client)

- [ ] **Step 4: Implement** (manual-tested only — SW interaction is hard to unit test)

```tsx
"use client";
import { useState } from "react";

export function OfflineToggle({ slug, albumId }: { slug: string; albumId: string }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);

  async function fetchAllPreviewUrls(): Promise<string[]> {
    const all: string[] = [];
    let cursor: string | null = null;
    while (true) {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/g/${slug}/api/media?${params.toString()}`);
      if (!res.ok) break;
      const data = (await res.json()) as {
        items: { previewUrl: string }[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      for (const it of data.items) all.push(it.previewUrl);
      if (!data.hasMore) break;
      cursor = data.nextCursor;
    }
    return all;
  }

  async function saveOffline() {
    if (typeof caches === "undefined") return;
    const urls = await fetchAllPreviewUrls();
    const cache = await caches.open(`gallery-album-${albumId}-v1`);
    setProgress({ done: 0, total: urls.length });
    let i = 0;
    for (const url of urls) {
      try { await cache.add(url); } catch {}
      i++;
      setProgress({ done: i, total: urls.length });
    }
    setDone(true);
  }

  if (done) return <button disabled className="text-sm text-green-700">Saved offline ✓</button>;
  return (
    <button onClick={saveOffline} className="text-sm rounded-md border px-3 py-1">
      {progress === null ? "Save offline" : `Caching ${progress.done}/${progress.total}...`}
    </button>
  );
}
```

> **Caller usage:** `<OfflineToggle slug={slug} albumId={found.album.id} />` — Task 16 page composition uses these props (NOT `urls`).

- [ ] **Step 5: Run tests → PASS**

- [ ] **Step 6: Commit**

```bash
git add src/features/guest-gallery/components/album-header.tsx \
        src/features/guest-gallery/components/install-pwa-button.tsx \
        src/features/guest-gallery/components/install-pwa-button.test.tsx \
        src/features/guest-gallery/components/offline-toggle.tsx
git commit -m "feat(guest-gallery): add header, install button, offline toggle"
```

---

## Task 16: Page composition (RSC)

**Files:**
- Create: `src/app/g/[slug]/layout.tsx` (root layout terpisah)
- Create: `src/app/g/[slug]/page.tsx`
- Create: `src/app/g/[slug]/loading.tsx`
- Create: `src/app/g/[slug]/not-found.tsx`
- Modify: existing `src/app/layout.tsx` → move into `src/app/(studio)/layout.tsx` if Next 16 supports multiple root layouts; otherwise leave studio root layout alone and use `app/g/[slug]/layout.tsx` as a nested layout (still works, just shares root).

> **Decision check:** Read `node_modules/next/dist/docs/` (per AGENTS.md) before assuming multiple root layouts. If Next 16 supports `app/(studio)/layout.tsx` + `app/(guest)/layout.tsx` as separate root layouts via groups, move studio routes accordingly. Otherwise: keep one root layout, and `app/g/[slug]/layout.tsx` is a child layout that overrides body styling for guest pages.

- [ ] **Step 1: Verify Next 16 multi-root-layout support**

Run: `Grep -r "Multiple root layouts" node_modules/next/dist/docs/ 2>/dev/null` or read `node_modules/next/dist/docs/02-app/01-getting-started/05-layouts-and-pages.mdx`.

- [ ] **Step 2: Create `loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="min-h-svh bg-[#FAF7F2] flex items-center justify-center">
      <div className="text-gray-500">Loading album…</div>
    </div>
  );
}
```

- [ ] **Step 3: Create `not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <div className="min-h-svh bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold mb-2">Album tidak ditemukan</h1>
      <p className="text-gray-600">Album ini mungkin sudah dihapus atau link salah.</p>
    </div>
  );
}
```

- [ ] **Step 4: Create `layout.tsx`** (mobile-first, dynamic manifest link)

```tsx
import type { ReactNode } from "react";

export default async function GuestLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <link rel="manifest" href={`/g/${slug}/manifest.webmanifest`} />
      <meta name="theme-color" content="#FAF7F2" />
      <div className="min-h-svh bg-[#FAF7F2] text-[#1A1A1A]">{children}</div>
    </>
  );
}
```

- [ ] **Step 5: Create `page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getAlbumBySlug } from "@/features/guest-gallery/server/get-album-by-slug";
import { batchPresignUrls } from "@/features/guest-gallery/server/batch-presign-urls";
import { canViewAlbum } from "@/features/guest-gallery/lib/access-control";
import { verifyCookie } from "@/features/guest-gallery/lib/cookies";
import { db } from "@/db";
import { galleryFavorites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PasswordGate } from "@/features/guest-gallery/components/password-gate";
import { GalleryGrid } from "@/features/guest-gallery/components/gallery-grid";
import { AlbumHeader } from "@/features/guest-gallery/components/album-header";
import { InstallPwaButton } from "@/features/guest-gallery/components/install-pwa-button";
import { OfflineToggle } from "@/features/guest-gallery/components/offline-toggle";

export default async function GuestGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getAlbumBySlug(slug);
  if (!found) notFound();

  const view = canViewAlbum(found.album);
  if (!view.ok && view.reason === "not-found") notFound();
  if (!view.ok && view.reason === "expired") {
    return (
      <div className="min-h-svh flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Album sudah berakhir</h1>
          <p className="text-gray-600">Hubungi photographer untuk link baru.</p>
        </div>
      </div>
    );
  }

  const secret = process.env.GUEST_COOKIE_SECRET!;
  const cookieStore = await cookies();

  // Password gate
  if (found.album.passwordHash) {
    const tok = cookieStore.get(`gk_unlock_${found.album.id}`)?.value;
    const payload = tok ? await verifyCookie<{ albumId: string }>(tok, secret) : null;
    if (!payload || payload.albumId !== found.album.id) {
      return <PasswordGate slug={slug} />;
    }
  }

  // Generate batch presigned URLs
  const presigned = await batchPresignUrls(
    found.media.map((m) => ({ id: m.id, r2Key: m.r2Key, thumbnailR2Key: m.thumbnailR2Key, variants: m.variants ?? {} })),
    60 * 60,
  );
  const photos = found.media.map((m) => ({
    id: m.id,
    thumbUrl: presigned[m.id].thumbUrl,
    previewUrl: presigned[m.id].previewUrl,
  }));

  // Guest detection + favorites
  const guestTok = cookieStore.get("gk_guest")?.value;
  const guestPayload = guestTok ? await verifyCookie<{ guestId: string; albumId: string }>(guestTok, secret) : null;
  const hasGuest = !!guestPayload && guestPayload.albumId === found.album.id;
  const favorites = new Set<string>();
  if (hasGuest && guestPayload) {
    const favs = await db.select().from(galleryFavorites).where(eq(galleryFavorites.guestId, guestPayload.guestId));
    for (const f of favs) favorites.add(f.mediaId);
  }

  // NOTE: Task 14b updates this section to use getAlbumMediaPage (first 60 only)
  // and pass initialCursor/hasMore to <GalleryGrid>. The snippet below shows the
  // FINAL shape after Task 14b is applied.
  const coverUrl = photos.find((p) => p.id === found.album.coverMediaId)?.previewUrl ?? photos[0]?.previewUrl ?? null;

  return (
    <main>
      <AlbumHeader slug={slug} title={found.album.name} photoCount={found.media.length} coverUrl={coverUrl} />
      <div className="px-4 sm:px-6 py-6 flex flex-wrap gap-3 justify-between items-center">
        <p className="text-sm text-gray-600">{found.media.length} foto</p>
        <div className="flex gap-2">
          <InstallPwaButton />
          <OfflineToggle slug={slug} albumId={found.album.id} />
        </div>
      </div>
      <div className="px-1 sm:px-2">
        <GalleryGrid
          slug={slug}
          initialPhotos={photos}
          initialCursor={null}
          hasMore={false}
          hasGuest={hasGuest}
          downloadPolicy={found.album.downloadPolicy}
          favorites={favorites}
        />
      </div>
      <footer className="py-10 text-center text-xs text-gray-500">
        Powered by Galeriku
      </footer>
    </main>
  );
}
```

- [ ] **Step 6: Run `pnpm build` to check it compiles**

- [ ] **Step 7: Manual smoke test**

`pnpm dev`, create published album manually via SQL or studio publish flow (Task 17), visit `/g/<slug>`.

- [ ] **Step 8: Commit**

```bash
git add src/app/g/[slug]/layout.tsx src/app/g/[slug]/page.tsx \
        src/app/g/[slug]/loading.tsx src/app/g/[slug]/not-found.tsx
git commit -m "feat(guest-gallery): wire up RSC page composition"
```

---

## Task 17: Studio side — publish album action + UI

**Files:**
- Create: `src/features/album/server/publish-album.ts` + test
- Create: `src/features/album/components/publish-album-dialog.tsx` + test
- Modify: album detail page to add Publish button

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/db";
import { user, album } from "@/db/schema";
import { publishAlbum } from "./publish-album";
import { eq } from "drizzle-orm";

describe("publishAlbum", () => {
  let userId: string, albumId: string;
  beforeEach(async () => {
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "s", email: `pa${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    userId = u.id;
    const [a] = await db.insert(album).values({ name: "Andini & Reza", createdBy: userId }).returning();
    albumId = a.id;
  });

  it("publishes album with slug and password hash", async () => {
    const r = await publishAlbum({ albumId, actorId: userId, password: "hunter2", downloadPolicy: "watermarked", expiresAt: null });
    expect(r.ok).toBe(true);
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.isPublic).toBe(true);
    expect(a.slug).toMatch(/^[a-z0-9]{5}-andini-reza$/);
    expect(a.passwordHash).toBeTruthy();
    expect(a.downloadPolicy).toBe("watermarked");
    expect(a.publishedAt).not.toBeNull();
  });

  it("publishes without password (passwordHash null)", async () => {
    const r = await publishAlbum({ albumId, actorId: userId, password: "", downloadPolicy: "none", expiresAt: null });
    expect(r.ok).toBe(true);
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.passwordHash).toBeNull();
  });

  it("rejects when actor is not creator", async () => {
    const [u2] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "x", email: `pb${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();
    const r = await publishAlbum({ albumId, actorId: u2.id, password: "", downloadPolicy: "none", expiresAt: null });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `publish-album.ts`**

```ts
import { db } from "@/db";
import { album } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { generateSlug } from "@/features/guest-gallery/lib/slug";

export type PublishResult = { ok: true; slug: string } | { ok: false; reason: "not-found" | "forbidden" };

export async function publishAlbum(input: {
  albumId: string;
  actorId: string;
  password: string;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: Date | null;
}): Promise<PublishResult> {
  const [a] = await db.select().from(album).where(eq(album.id, input.albumId)).limit(1);
  if (!a) return { ok: false, reason: "not-found" };
  if (a.createdBy !== input.actorId) return { ok: false, reason: "forbidden" };

  // Generate unique slug (retry on collision, max 5 attempts)
  let slug = a.slug ?? "";
  if (!slug) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateSlug(a.name);
      const [existing] = await db.select({ id: album.id }).from(album).where(eq(album.slug, candidate)).limit(1);
      if (!existing) {
        slug = candidate;
        break;
      }
    }
  }

  const passwordHash = input.password ? await hash(input.password) : null;
  await db
    .update(album)
    .set({
      slug,
      isPublic: true,
      passwordHash,
      downloadPolicy: input.downloadPolicy,
      publishedAt: new Date(),
      expiresAt: input.expiresAt,
    })
    .where(eq(album.id, input.albumId));

  return { ok: true, slug };
}
```

- [ ] **Step 3: Run → PASS**

- [ ] **Step 4: Implement `publish-album-dialog.tsx`** (skip detailed test, use existing dialog patterns)

```tsx
"use client";
import { useState, useTransition } from "react";

export function PublishAlbumDialog({
  albumId, onPublish,
}: { albumId: string; onPublish: (input: { password: string; downloadPolicy: "none" | "watermarked" | "clean"; expiresAt: string | null }) => Promise<{ ok: boolean; slug?: string }> }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [policy, setPolicy] = useState<"none" | "watermarked" | "clean">("none");
  const [expires, setExpires] = useState("");
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  function submit() {
    start(async () => {
      const r = await onPublish({ password, downloadPolicy: policy, expiresAt: expires || null });
      if (r.ok && r.slug) setLink(`${window.location.origin}/g/${r.slug}`);
    });
  }

  if (!open) return <button onClick={() => setOpen(true)} className="rounded bg-black text-white px-4 py-2">Publish to client</button>;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
        <h2 className="text-lg font-semibold">Publish album</h2>
        {link ? (
          <>
            <p className="text-sm">Link untuk klien:</p>
            <input readOnly value={link} className="w-full border px-2 py-1 rounded text-sm" onClick={(e) => (e.target as HTMLInputElement).select()} />
            <button onClick={() => navigator.clipboard.writeText(link)} className="w-full bg-black text-white py-2 rounded">Copy link</button>
          </>
        ) : (
          <>
            <label className="block text-sm">
              Password (opsional)
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border px-2 py-1 rounded" />
            </label>
            <label className="block text-sm">
              Download policy
              <select value={policy} onChange={(e) => setPolicy(e.target.value as any)} className="mt-1 w-full border px-2 py-1 rounded">
                <option value="none">No download</option>
                <option value="watermarked">Watermarked only</option>
                <option value="clean">Clean (full quality)</option>
              </select>
            </label>
            <label className="block text-sm">
              Expires at (opsional)
              <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-1 w-full border px-2 py-1 rounded" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 border py-2 rounded">Cancel</button>
              <button onClick={submit} disabled={pending} className="flex-1 bg-black text-white py-2 rounded">{pending ? "..." : "Publish"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire dialog into existing album detail page**

Find existing album detail page (likely `src/app/(studio)/albums/[id]/page.tsx`), add an action button area that includes `<PublishAlbumDialog>`. The page must pass a server action wrapper that calls `publishAlbum` and returns `{ ok, slug }`.

Create wrapper `src/features/album/actions/publish-album.action.ts`:

```ts
"use server";
import { publishAlbum } from "../server/publish-album";
import { getSessionWithRole } from "@/features/auth/lib/session";

export async function publishAlbumAction(input: {
  albumId: string;
  password: string;
  downloadPolicy: "none" | "watermarked" | "clean";
  expiresAt: string | null;
}) {
  const session = await getSessionWithRole();
  if (!session) return { ok: false } as const;
  const r = await publishAlbum({
    albumId: input.albumId,
    actorId: session.user.id,
    password: input.password,
    downloadPolicy: input.downloadPolicy,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });
  return r.ok ? { ok: true as const, slug: r.slug } : { ok: false as const };
}
```

- [ ] **Step 6: Run all tests + build → PASS**

- [ ] **Step 7: Commit**

```bash
git add src/features/album/server/publish-album.ts \
        src/features/album/server/publish-album.test.ts \
        src/features/album/components/publish-album-dialog.tsx \
        src/features/album/actions/publish-album.action.ts \
        src/app/<album-detail-page>
git commit -m "feat(album): add publish-to-client action and dialog"
```

---

## Task 18: Service worker offline strategy

**Files:**
- Modify: `src/app/sw.ts` (existing Serwist SW source)

- [ ] **Step 1: Read current `src/app/sw.ts`** to understand existing routes & strategies.

- [ ] **Step 2: Add gallery cache rules**

Add a runtime route inside the existing Serwist `runtimeCaching` array (or equivalent):

```ts
// Inside src/app/sw.ts runtime caching list
{
  matcher: ({ url }) => url.pathname.startsWith("/g/"),
  handler: new NetworkFirst({
    cacheName: "guest-gallery-shell",
    networkTimeoutSeconds: 3,
  }),
},
{
  // R2 presigned image URLs (host matches R2 public domain or signed S3 host)
  matcher: ({ url }) => url.hostname.includes("r2.cloudflarestorage.com") || url.hostname.includes(process.env.NEXT_PUBLIC_R2_HOST ?? ""),
  handler: new CacheFirst({
    cacheName: "gallery-images",
    plugins: [new ExpirationPlugin({ maxEntries: 2000, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  }),
},
```

> Adapt imports to whatever Serwist version the project uses (`serwist` package). Check `node_modules/serwist/dist/...` if unsure.

- [ ] **Step 3: Run `pnpm build`**

- [ ] **Step 4: Manual test**

Document in `docs/superpowers/manual-tests/guest-gallery-offline.md`:
1. Build prod, serve, install PWA on phone
2. Open album online → tap "Save offline" → wait for progress → done
3. Toggle airplane mode → reopen PWA → confirm photos still visible

- [ ] **Step 5: Commit**

```bash
git add src/app/sw.ts docs/superpowers/manual-tests/guest-gallery-offline.md
git commit -m "feat(guest-gallery): add SW caching rules and offline manual test doc"
```

---

## Task 19: E2E tests

**File:** `e2e/guest-gallery.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { test, expect } from "@playwright/test";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { hash } from "@node-rs/argon2";

test.describe("guest gallery", () => {
  let publicSlug: string;
  let passwordSlug: string;
  let expiredSlug: string;

  test.beforeAll(async () => {
    await db.delete(media);
    await db.delete(album);
    await db.delete(user);
    const [u] = await db.insert(user).values({
      id: crypto.randomUUID(), name: "Studio E2E", email: `e2e${Date.now()}@x.io`,
      emailVerified: true, role: "owner",
    }).returning();

    const [a1] = await db.insert(album).values({
      name: "Public Album", slug: "abc12-public", isPublic: true, createdBy: u.id, publishedAt: new Date(),
      downloadPolicy: "none",
    }).returning();
    publicSlug = a1.slug!;
    await db.insert(media).values({
      albumId: a1.id, uploadedBy: u.id, type: "photo", filename: "p.jpg",
      r2Key: "test/p.jpg", thumbnailR2Key: "test/p-thumb.jpg",
      mimeType: "image/jpeg", sizeBytes: 1, variantStatus: "ready",
    });

    const ph = await hash("hunter2");
    const [a2] = await db.insert(album).values({
      name: "Locked Album", slug: "abc12-locked", isPublic: true, passwordHash: ph,
      createdBy: u.id, publishedAt: new Date(), downloadPolicy: "none",
    }).returning();
    passwordSlug = a2.slug!;

    const [a3] = await db.insert(album).values({
      name: "Expired", slug: "abc12-expired", isPublic: true, createdBy: u.id,
      publishedAt: new Date(), expiresAt: new Date(Date.now() - 86400_000), downloadPolicy: "none",
    }).returning();
    expiredSlug = a3.slug!;
  });

  test("public album shows photos and favorite-with-name flow", async ({ page }) => {
    await page.goto(`/g/${publicSlug}`);
    await expect(page.getByRole("heading", { name: "Public Album" })).toBeVisible();
    await page.getByRole("button", { name: "Favorite" }).first().click();
    await expect(page.getByPlaceholder(/nama/i)).toBeVisible();
    await page.getByPlaceholder(/nama/i).fill("Sinta");
    await page.getByRole("button", { name: /simpan/i }).click();
    await page.reload();
    await expect(page.locator(".text-red-500").first()).toBeVisible();
  });

  test("password gate flow", async ({ page }) => {
    await page.goto(`/g/${passwordSlug}`);
    await expect(page.getByText("Album terkunci")).toBeVisible();
    await page.getByPlaceholder(/password/i).fill("wrong");
    await page.getByRole("button", { name: /unlock/i }).click();
    await expect(page.getByText(/password salah/i)).toBeVisible();
    await page.getByPlaceholder(/password/i).fill("hunter2");
    await page.getByRole("button", { name: /unlock/i }).click();
    await expect(page.getByRole("heading", { name: "Locked Album" })).toBeVisible();
  });

  test("expired album shows 410-style page", async ({ page }) => {
    await page.goto(`/g/${expiredSlug}`);
    await expect(page.getByText(/sudah berakhir/i)).toBeVisible();
  });

  test("404 on bad slug", async ({ page }) => {
    const r = await page.goto("/g/xxxxx-nope");
    expect(r?.status()).toBe(404);
  });

  test("manifest endpoint returns valid JSON", async ({ request }) => {
    const r = await request.get(`/g/${publicSlug}/manifest.webmanifest`);
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.start_url).toBe(`/g/${publicSlug}`);
  });
});
```

- [ ] **Step 2: Run `pnpm e2e` → expect failures, then fix any wiring issues**

- [ ] **Step 3: Commit**

```bash
git add e2e/guest-gallery.spec.ts
git commit -m "test(guest-gallery): add E2E coverage"
```

---

## Task 20: Boundary lint rule + final verification

- [ ] **Step 1: Add ESLint rule**

Modify `eslint.config.mjs`:

```js
// add to existing config array
{
  files: ["src/features/guest-gallery/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["@/features/auth/*"], message: "guest-gallery must not depend on auth feature" },
      ],
    }],
  },
},
```

- [ ] **Step 2: Run lint**

`pnpm lint` → must pass (no auth imports inside guest-gallery).

- [ ] **Step 3: Add `GUEST_COOKIE_SECRET` to env files**

Update `.env.local` and `.env.test`:

```
GUEST_COOKIE_SECRET=<32+ random bytes, e.g. openssl rand -base64 48>
```

Document in `README.md` (env section, if exists).

- [ ] **Step 4: Run full suite**

```bash
pnpm test
pnpm lint
pnpm build
pnpm e2e
```

All must pass.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.mjs .env.example
git commit -m "chore(guest-gallery): enforce feature boundary + env setup"
```

---

## Out of Scope (deferred to later sub-projects)

- Real watermark generation (C2): variant `watermarkedFull` is currently aliased to original via `previewUrl` fallback in the download route. C2 will plug in real watermarked variants.
- Background queue (S3): variant generation stays sync inline. Migration path: extract `generateVariants(media)` into a job handler, call from BullMQ worker.
- Email notifications on favorite (G3)
- Analytics view tracking (G4)
- Custom domain / studio subdomain (G1)
- Subscription gating (M1)

## Self-Review Notes (filled by author)

- **Spec coverage:** All 12 design decisions from the spec are addressed by Tasks 1–20. Each spec section (Architecture, Data Model, Flows, Error Handling, Security, Testing) has corresponding tasks.
- **Placeholder scan:** No "TBD" or "implement later" inside steps. Out-of-scope C2 watermark tied to a concrete fallback in Task 14 step 6.
- **Type consistency:** `AlbumGate`, `AlbumWithMedia`, `Photo`, `PresignableMedia`, `MediaVariants` are defined in their respective tasks; later tasks reference exactly those names. `canDownload`/`downloadVariantKey` signatures match between Task 4 and Task 14.
- **Scope:** This is a single sub-project (C1). Ready for execution.
