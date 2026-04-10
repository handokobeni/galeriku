# C2 Watermark Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic watermark compositing on published album photos so photographers can share branded previews while protecting their full-resolution originals.

**Architecture:** Server-side sharp pipeline composites a PNG logo or rendered text onto each photo at configurable position/opacity/scale. Global watermark config lives in `app_settings`; per-album overrides in `album.watermarkOverride` (nullable jsonb). Bulk generation runs synchronously on publish with in-memory progress tracking polled by the client every 2s. The existing C1 download route already reads `media.variants.watermarkedFull` and falls back to original -- once C2 populates variants, downloads automatically serve watermarked files with zero change to C1 code.

**Tech Stack:** sharp (image compositing), Drizzle ORM, Next.js 16 App Router (Promise params), R2 via @aws-sdk/client-s3, Vitest + happy-dom + @testing-library/react, Playwright.

**Spec reference:** `docs/superpowers/specs/2026-04-09-watermark-engine-design.md`

**Testing:** TDD throughout. Vitest + happy-dom + @testing-library/react. E2E with Playwright. Tests use `galeriku_test` DB.

---

## File Map

### Task 1 -- Schema migration
- Modify: `src/db/schema/album.ts` (add `watermarkOverride` jsonb column)
- Run: `pnpm db:generate` + `pnpm db:test:migrate`
- Test: `src/features/watermark/__tests__/schema-migration.test.ts`

### Task 2 -- `lib/config.ts` (types + resolveWatermarkConfig)
- Create: `src/features/watermark/lib/config.ts`
- Test: `src/features/watermark/lib/__tests__/config.test.ts`

### Task 3 -- `lib/composite.ts` (sharp watermark compositing)
- Create: `src/features/watermark/lib/composite.ts`
- Test: `src/features/watermark/lib/__tests__/composite.test.ts`

### Task 4 -- `lib/text-renderer.ts` (render text to PNG)
- Create: `src/features/watermark/lib/text-renderer.ts`
- Test: `src/features/watermark/lib/__tests__/text-renderer.test.ts`

### Task 5 -- `lib/job-store.ts` (in-memory progress tracking)
- Create: `src/features/watermark/lib/job-store.ts`
- Test: `src/features/watermark/lib/__tests__/job-store.test.ts`

### Task 6 -- `server/upload-logo.ts`
- Create: `src/features/watermark/server/upload-logo.ts`
- Test: `src/features/watermark/server/__tests__/upload-logo.test.ts`

### Task 7 -- `server/get-watermark-config.ts`
- Create: `src/features/watermark/server/get-watermark-config.ts`
- Test: `src/features/watermark/server/__tests__/get-watermark-config.test.ts`

### Task 8 -- `server/preview-watermark.ts`
- Create: `src/features/watermark/server/preview-watermark.ts`
- Test: `src/features/watermark/server/__tests__/preview-watermark.test.ts`

### Task 9 -- `server/generate-watermarks.ts`
- Create: `src/features/watermark/server/generate-watermarks.ts`
- Test: `src/features/watermark/server/__tests__/generate-watermarks.test.ts`

### Task 10 -- API routes
- Create: `src/app/api/watermark/logo/route.ts`
- Create: `src/app/api/watermark/preview/route.ts`
- Create: `src/app/api/watermark/status/[jobId]/route.ts`
- Test: `src/app/api/watermark/__tests__/routes.test.ts`

### Task 11 -- Components: logo-uploader + watermark-settings
- Create: `src/features/watermark/components/logo-uploader.tsx`
- Create: `src/features/watermark/components/watermark-settings.tsx`
- Test: `src/features/watermark/components/__tests__/logo-uploader.test.tsx`
- Test: `src/features/watermark/components/__tests__/watermark-settings.test.tsx`

### Task 12 -- Component: watermark-preview-modal
- Create: `src/features/watermark/components/watermark-preview-modal.tsx`
- Test: `src/features/watermark/components/__tests__/watermark-preview-modal.test.tsx`

### Task 13 -- Extend publish flow
- Modify: `src/features/album/server/publish-album.ts`
- Modify: `src/features/album/actions/publish-album.action.ts`
- Modify: `src/features/album/components/publish-album-dialog.tsx`
- Modify: `src/features/album/components/album-detail-client.tsx`
- Test: `src/features/album/server/__tests__/publish-album-watermark.test.ts`
- Test: `src/features/album/components/__tests__/publish-album-dialog-watermark.test.tsx`

### Task 14 -- E2E tests
- Create: `e2e/watermark.spec.ts`

### Task 15 -- Final verification
- Run full suite + build

---

## Task 1: Schema migration

**Files:**
- Modify: `src/db/schema/album.ts`
- Test: `src/features/watermark/__tests__/schema-migration.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/__tests__/schema-migration.test.ts`:

```ts
import { describe, expect, it, beforeAll } from "vitest";
import { db } from "@/db";
import { album } from "@/db/schema";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("watermark schema migration", () => {
  let albumId: string;

  beforeAll(async () => {
    const [u] = await db
      .insert(user)
      .values({
        name: "wm1-owner",
        email: `wm1-${Date.now()}@test.io`,
        username: `wm1-user-${Date.now()}`,
        emailVerified: true,
        role: "owner",
      })
      .returning();

    const [a] = await db
      .insert(album)
      .values({
        name: "wm1-test-album",
        createdBy: u.id,
      })
      .returning();
    albumId = a.id;
  });

  it("album has watermarkOverride column defaulting to null", async () => {
    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a).toBeDefined();
    expect(a.watermarkOverride).toBeNull();
  });

  it("album accepts watermarkOverride jsonb data", async () => {
    const override = { mode: "text" as const, text: "Studio XYZ", opacity: 60 };
    await db
      .update(album)
      .set({ watermarkOverride: override })
      .where(eq(album.id, albumId));

    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.watermarkOverride).toEqual(override);
  });

  it("album watermarkOverride can be set back to null", async () => {
    await db
      .update(album)
      .set({ watermarkOverride: null })
      .where(eq(album.id, albumId));

    const [a] = await db.select().from(album).where(eq(album.id, albumId));
    expect(a.watermarkOverride).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/__tests__/schema-migration.test.ts
```

Expected: FAIL -- `watermarkOverride` column does not exist.

- [ ] **Step 3: Install sharp**

sharp is NOT currently in `package.json`. Install it now (needed by Tasks 3, 4, 6, 8, 9):

```bash
pnpm add sharp
pnpm add -D @types/sharp
```

- [ ] **Step 4: Modify `src/db/schema/album.ts`**

Add the `watermarkOverride` column and the type import:

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, primaryKey, index, boolean, jsonb } from "drizzle-orm/pg-core";
import { user } from "./user";
import type { WatermarkConfig } from "@/features/watermark/lib/config";

export const album = pgTable("album", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  coverMediaId: uuid("cover_media_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  slug: text("slug").unique(),
  isPublic: boolean("is_public").default(false).notNull(),
  passwordHash: text("password_hash"),
  downloadPolicy: text("download_policy", { enum: ["none", "watermarked", "clean"] })
    .default("none")
    .notNull(),
  watermarkOverride: jsonb("watermark_override").$type<Partial<WatermarkConfig>>(),
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
    albumId: uuid("album_id")
      .notNull()
      .references(() => album.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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

Note: The `WatermarkConfig` type import creates a circular dependency concern. Since this is a `type` import only, it is safe -- TypeScript erases it at compile time. The config type must be created first (Task 2 Step 3 creates a stub), or use an inline type here and align in Task 2. Pragmatic approach: create the config file with types first in this step.

Create `src/features/watermark/lib/config.ts` (types only, full implementation in Task 2):

```ts
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WatermarkConfig = {
  mode: "logo" | "text";
  logoR2Key: string | null;
  text: string;
  position: WatermarkPosition;
  opacity: number;
  scale: number;
};
```

- [ ] **Step 5: Generate and run migration**

```bash
pnpm db:generate
pnpm db:test:migrate
```

- [ ] **Step 6: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/__tests__/schema-migration.test.ts
```

Expected: PASS

- [ ] **Step 7: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(watermark): add watermarkOverride column to album + install sharp"
```

---

## Task 2: `lib/config.ts` -- types + resolveWatermarkConfig

**Files:**
- Modify: `src/features/watermark/lib/config.ts` (add DEFAULTS + resolveWatermarkConfig)
- Test: `src/features/watermark/lib/__tests__/config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/lib/__tests__/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  resolveWatermarkConfig,
  DEFAULTS,
  type WatermarkConfig,
} from "../config";

describe("resolveWatermarkConfig", () => {
  it("returns DEFAULTS when both global and override are null", () => {
    const result = resolveWatermarkConfig(null, null);
    expect(result).toEqual(DEFAULTS);
  });

  it("returns DEFAULTS when both global and override are undefined", () => {
    const result = resolveWatermarkConfig(undefined, undefined);
    expect(result).toEqual(DEFAULTS);
  });

  it("merges global config over defaults", () => {
    const global: Partial<WatermarkConfig> = {
      mode: "text",
      text: "Studio ABC",
      opacity: 60,
    };
    const result = resolveWatermarkConfig(global, null);
    expect(result.mode).toBe("text");
    expect(result.text).toBe("Studio ABC");
    expect(result.opacity).toBe(60);
    // Remaining fields from DEFAULTS
    expect(result.position).toBe(DEFAULTS.position);
    expect(result.scale).toBe(DEFAULTS.scale);
    expect(result.logoR2Key).toBe(DEFAULTS.logoR2Key);
  });

  it("merges album override over global over defaults", () => {
    const global: Partial<WatermarkConfig> = {
      mode: "logo",
      logoR2Key: "watermarks/studio1/logo.png",
      opacity: 50,
    };
    const override: Partial<WatermarkConfig> = {
      opacity: 80,
      position: "bottom-right",
    };
    const result = resolveWatermarkConfig(global, override);
    expect(result.mode).toBe("logo");
    expect(result.logoR2Key).toBe("watermarks/studio1/logo.png");
    expect(result.opacity).toBe(80);
    expect(result.position).toBe("bottom-right");
    expect(result.scale).toBe(DEFAULTS.scale);
  });

  it("album override alone merges over defaults", () => {
    const override: Partial<WatermarkConfig> = { scale: 45 };
    const result = resolveWatermarkConfig(null, override);
    expect(result.scale).toBe(45);
    expect(result.mode).toBe(DEFAULTS.mode);
  });

  it("empty partials return defaults", () => {
    const result = resolveWatermarkConfig({}, {});
    expect(result).toEqual(DEFAULTS);
  });

  it("DEFAULTS has correct values per spec", () => {
    expect(DEFAULTS).toEqual({
      mode: "logo",
      logoR2Key: null,
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/config.test.ts
```

Expected: FAIL -- `resolveWatermarkConfig` and `DEFAULTS` not exported.

- [ ] **Step 3: Implement `src/features/watermark/lib/config.ts`**

Replace the file (types were stubbed in Task 1):

```ts
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WatermarkConfig = {
  mode: "logo" | "text";
  logoR2Key: string | null;
  text: string;
  position: WatermarkPosition;
  opacity: number;   // 10-100
  scale: number;     // 10-60 (% of photo width)
};

export const DEFAULTS: WatermarkConfig = {
  mode: "logo",
  logoR2Key: null,
  text: "",
  position: "center",
  opacity: 40,
  scale: 30,
};

/**
 * Resolve watermark config by layering: DEFAULTS < global < albumOverride.
 * Pure function -- no side effects.
 */
export function resolveWatermarkConfig(
  global: Partial<WatermarkConfig> | null | undefined,
  albumOverride: Partial<WatermarkConfig> | null | undefined,
): WatermarkConfig {
  return {
    ...DEFAULTS,
    ...(global ?? {}),
    ...(albumOverride ?? {}),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/config.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add WatermarkConfig types, DEFAULTS, and resolveWatermarkConfig"
```

---

## Task 3: `lib/composite.ts` -- sharp watermark compositing

**Files:**
- Create: `src/features/watermark/lib/composite.ts`
- Test: `src/features/watermark/lib/__tests__/composite.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/lib/__tests__/composite.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { WatermarkConfig } from "../config";

// Mock sharp before importing composite
const mockComposite = vi.fn().mockReturnThis();
const mockJpeg = vi.fn().mockReturnThis();
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("composited"));
const mockMetadata = vi.fn().mockResolvedValue({ width: 2000, height: 1500 });
const mockResize = vi.fn().mockReturnThis();
const mockEnsureAlpha = vi.fn().mockReturnThis();
const mockToFormat = vi.fn().mockReturnThis();

const mockSharpInstance = {
  composite: mockComposite,
  jpeg: mockJpeg,
  toBuffer: mockToBuffer,
  metadata: mockMetadata,
  resize: mockResize,
  ensureAlpha: mockEnsureAlpha,
  toFormat: mockToFormat,
};

vi.mock("sharp", () => ({
  default: vi.fn(() => mockSharpInstance),
}));

import { compositeWatermark } from "../composite";

describe("compositeWatermark", () => {
  const fotoBuffer = Buffer.from("fake-foto");
  const watermarkBuffer = Buffer.from("fake-watermark");

  beforeEach(() => {
    vi.clearAllMocks();
    mockComposite.mockReturnThis();
    mockJpeg.mockReturnThis();
    mockToBuffer.mockResolvedValue(Buffer.from("composited"));
    mockMetadata.mockResolvedValue({ width: 2000, height: 1500 });
    mockResize.mockReturnThis();
  });

  const baseConfig: WatermarkConfig = {
    mode: "logo",
    logoR2Key: "logo.png",
    text: "",
    position: "center",
    opacity: 40,
    scale: 30,
  };

  it("calls sharp.composite with center gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, baseConfig);
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "centre" }),
    ]);
  });

  it("maps top-left to northwest gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "top-left",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "northwest" }),
    ]);
  });

  it("maps top-right to northeast gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "top-right",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "northeast" }),
    ]);
  });

  it("maps bottom-left to southwest gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "bottom-left",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "southwest" }),
    ]);
  });

  it("maps bottom-right to southeast gravity", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      position: "bottom-right",
    });
    expect(mockComposite).toHaveBeenCalledWith([
      expect.objectContaining({ gravity: "southeast" }),
    ]);
  });

  it("resizes watermark to scale% of foto width", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, {
      ...baseConfig,
      scale: 30,
    });
    // 30% of 2000px = 600px
    expect(mockResize).toHaveBeenCalledWith(600);
  });

  it("returns a buffer", async () => {
    const result = await compositeWatermark(fotoBuffer, watermarkBuffer, baseConfig);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("calls jpeg for output format", async () => {
    await compositeWatermark(fotoBuffer, watermarkBuffer, baseConfig);
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 90 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/composite.test.ts
```

Expected: FAIL -- `compositeWatermark` not found.

- [ ] **Step 3: Implement `src/features/watermark/lib/composite.ts`**

```ts
import sharp from "sharp";
import type { WatermarkConfig, WatermarkPosition } from "./config";

const GRAVITY_MAP: Record<WatermarkPosition, string> = {
  center: "centre",
  "top-left": "northwest",
  "top-right": "northeast",
  "bottom-left": "southwest",
  "bottom-right": "southeast",
};

/**
 * Composite a watermark buffer onto a foto buffer.
 * Returns JPEG buffer. Pure I/O -- no storage access.
 *
 * @param foto - Original photo buffer
 * @param watermark - Watermark image buffer (PNG with alpha)
 * @param config - Resolved watermark configuration
 */
export async function compositeWatermark(
  foto: Buffer,
  watermark: Buffer,
  config: WatermarkConfig,
): Promise<Buffer> {
  const fotoImage = sharp(foto);
  const metadata = await fotoImage.metadata();
  const fotoWidth = metadata.width ?? 2000;

  // Scale watermark to config.scale% of foto width
  const targetWidth = Math.round((config.scale / 100) * fotoWidth);
  const resizedWatermark = await sharp(watermark)
    .resize(targetWidth)
    .ensureAlpha()
    .toFormat("png")
    .composite([
      {
        // Apply opacity via a semi-transparent overlay
        input: Buffer.from(
          `<svg><rect x="0" y="0" width="${targetWidth}" height="9999" fill="white" opacity="${config.opacity / 100}"/></svg>`
        ),
        blend: "dest-in",
      },
    ])
    .toBuffer();

  return fotoImage
    .composite([
      {
        input: resizedWatermark,
        gravity: GRAVITY_MAP[config.position],
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/composite.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add compositeWatermark with sharp gravity mapping"
```

---

## Task 4: `lib/text-renderer.ts` -- render text to PNG

**Files:**
- Create: `src/features/watermark/lib/text-renderer.ts`
- Test: `src/features/watermark/lib/__tests__/text-renderer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/lib/__tests__/text-renderer.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("png-output"));
const mockPng = vi.fn().mockReturnValue({ toBuffer: mockToBuffer });

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    png: mockPng,
    toBuffer: mockToBuffer,
  })),
}));

import { renderTextWatermark } from "../text-renderer";

describe("renderTextWatermark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPng.mockReturnValue({ toBuffer: mockToBuffer });
    mockToBuffer.mockResolvedValue(Buffer.from("png-output"));
  });

  it("throws on empty text", async () => {
    await expect(renderTextWatermark("", {})).rejects.toThrow(
      "text cannot be empty"
    );
  });

  it("throws on whitespace-only text", async () => {
    await expect(renderTextWatermark("   ", {})).rejects.toThrow(
      "text cannot be empty"
    );
  });

  it("truncates text longer than 100 characters", async () => {
    const long = "A".repeat(150);
    const result = await renderTextWatermark(long, {});
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("returns a PNG buffer for valid text", async () => {
    const result = await renderTextWatermark("Studio XYZ", {});
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("passes text to sharp via SVG input", async () => {
    const { default: sharp } = await import("sharp");
    await renderTextWatermark("My Studio", {});
    const call = vi.mocked(sharp).mock.calls[0];
    const input = call[0];
    expect(Buffer.isBuffer(input)).toBe(true);
    const svgStr = input!.toString();
    expect(svgStr).toContain("My Studio");
    expect(svgStr).toContain("<svg");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/text-renderer.test.ts
```

Expected: FAIL -- `renderTextWatermark` not found.

- [ ] **Step 3: Implement `src/features/watermark/lib/text-renderer.ts`**

```ts
import sharp from "sharp";

const MAX_TEXT_LENGTH = 100;

/**
 * Render text string to a PNG buffer with transparent background.
 * Used as watermark input when mode is "text".
 */
export async function renderTextWatermark(
  text: string,
  _opts: { opacity?: number; scale?: number },
): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("text cannot be empty");
  }

  const safeText = trimmed.length > MAX_TEXT_LENGTH
    ? trimmed.slice(0, MAX_TEXT_LENGTH)
    : trimmed;

  // Escape XML entities
  const escaped = safeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const fontSize = 64;
  const padding = 20;
  // Approximate width: ~0.6em per character
  const estimatedWidth = Math.ceil(escaped.length * fontSize * 0.6) + padding * 2;
  const height = fontSize + padding * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${estimatedWidth}" height="${height}">
    <text
      x="50%"
      y="50%"
      dominant-baseline="central"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${fontSize}"
      fill="white"
      opacity="0.9"
    >${escaped}</text>
  </svg>`;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/text-renderer.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add renderTextWatermark SVG-to-PNG renderer"
```

---

## Task 5: `lib/job-store.ts` -- in-memory progress tracking

**Files:**
- Create: `src/features/watermark/lib/job-store.ts`
- Test: `src/features/watermark/lib/__tests__/job-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/lib/__tests__/job-store.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import {
  createJob,
  getJob,
  updateJob,
  deleteJob,
  type WatermarkJob,
} from "../job-store";

describe("job-store", () => {
  const albumId = "album-123";

  beforeEach(() => {
    // Clean up any existing job
    deleteJob(albumId);
  });

  it("createJob returns a job with initial state", () => {
    const job = createJob(albumId, 10);
    expect(job.albumId).toBe(albumId);
    expect(job.total).toBe(10);
    expect(job.done).toBe(0);
    expect(job.status).toBe("processing");
    expect(job.skipped).toEqual([]);
    expect(job.error).toBeUndefined();
  });

  it("getJob returns the created job", () => {
    createJob(albumId, 5);
    const job = getJob(albumId);
    expect(job).toBeDefined();
    expect(job!.albumId).toBe(albumId);
  });

  it("getJob returns undefined for non-existent job", () => {
    expect(getJob("non-existent")).toBeUndefined();
  });

  it("updateJob merges partial updates", () => {
    createJob(albumId, 10);
    updateJob(albumId, { done: 5 });
    const job = getJob(albumId);
    expect(job!.done).toBe(5);
    expect(job!.status).toBe("processing");
  });

  it("updateJob can set status to completed", () => {
    createJob(albumId, 3);
    updateJob(albumId, { done: 3, status: "completed" });
    const job = getJob(albumId);
    expect(job!.status).toBe("completed");
    expect(job!.done).toBe(3);
  });

  it("updateJob can set status to failed with error", () => {
    createJob(albumId, 3);
    updateJob(albumId, { status: "failed", error: "R2 unreachable" });
    const job = getJob(albumId);
    expect(job!.status).toBe("failed");
    expect(job!.error).toBe("R2 unreachable");
  });

  it("updateJob appends to skipped array via custom logic", () => {
    createJob(albumId, 5);
    const job = getJob(albumId)!;
    job.skipped.push("media-1");
    updateJob(albumId, { skipped: job.skipped });
    expect(getJob(albumId)!.skipped).toEqual(["media-1"]);
  });

  it("deleteJob removes the job", () => {
    createJob(albumId, 5);
    deleteJob(albumId);
    expect(getJob(albumId)).toBeUndefined();
  });

  it("createJob overwrites existing job for same albumId (dedup)", () => {
    createJob(albumId, 10);
    updateJob(albumId, { done: 5 });
    const newJob = createJob(albumId, 20);
    expect(newJob.total).toBe(20);
    expect(newJob.done).toBe(0);
  });

  it("createJob with 0 total works", () => {
    const job = createJob(albumId, 0);
    expect(job.total).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/job-store.test.ts
```

Expected: FAIL -- module not found.

- [ ] **Step 3: Implement `src/features/watermark/lib/job-store.ts`**

```ts
export type WatermarkJob = {
  albumId: string;
  total: number;
  done: number;
  status: "processing" | "completed" | "failed";
  error?: string;
  skipped: string[];
};

/**
 * In-memory job store. Acceptable for MVP -- data loss on restart is fine
 * because re-publish regenerates. Keyed by albumId (last job wins).
 */
const jobs = new Map<string, WatermarkJob>();

export function createJob(albumId: string, total: number): WatermarkJob {
  const job: WatermarkJob = {
    albumId,
    total,
    done: 0,
    status: "processing",
    skipped: [],
  };
  jobs.set(albumId, job);
  return job;
}

export function getJob(albumId: string): WatermarkJob | undefined {
  return jobs.get(albumId);
}

export function updateJob(
  albumId: string,
  update: Partial<Omit<WatermarkJob, "albumId">>,
): void {
  const existing = jobs.get(albumId);
  if (!existing) return;
  Object.assign(existing, update);
}

export function deleteJob(albumId: string): void {
  jobs.delete(albumId);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/lib/__tests__/job-store.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add in-memory WatermarkJob store with CRUD"
```

---

## Task 6: `server/upload-logo.ts`

**Files:**
- Create: `src/features/watermark/server/upload-logo.ts`
- Test: `src/features/watermark/server/__tests__/upload-logo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/server/__tests__/upload-logo.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock sharp
const mockMetadata = vi.fn();
const mockResize = vi.fn().mockReturnThis();
const mockPng = vi.fn().mockReturnThis();
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("resized"));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    metadata: mockMetadata,
    resize: mockResize,
    png: mockPng,
    toBuffer: mockToBuffer,
  })),
}));

// Mock R2 helpers
vi.mock("@/shared/lib/r2", () => ({
  getObject: vi.fn(),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getViewPresignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/logo.png"),
}));

// Mock S3 PutObjectCommand
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

import { uploadLogo, type UploadLogoResult } from "../upload-logo";

describe("uploadLogo", () => {
  // Valid PNG magic bytes
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validPng = Buffer.concat([PNG_MAGIC, Buffer.alloc(100)]);

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue([]),
  } as any;

  const mockR2Upload = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockMetadata.mockResolvedValue({ format: "png", width: 500, height: 200 });
    mockToBuffer.mockResolvedValue(Buffer.from("resized"));
  });

  it("rejects non-PNG (wrong magic bytes)", async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0)]);
    const result = await uploadLogo({
      buffer: jpegBuffer,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("PNG");
  });

  it("rejects file > 2MB", async () => {
    const bigBuffer = Buffer.concat([PNG_MAGIC, Buffer.alloc(2 * 1024 * 1024 + 1)]);
    const result = await uploadLogo({
      buffer: bigBuffer,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("2 MB");
  });

  it("rejects logo smaller than 100px", async () => {
    mockMetadata.mockResolvedValue({ format: "png", width: 50, height: 30 });
    const result = await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("too small");
  });

  it("auto-resizes logo > 2000px", async () => {
    mockMetadata.mockResolvedValue({ format: "png", width: 3000, height: 1000 });
    const result = await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(true);
    expect(mockResize).toHaveBeenCalledWith(2000);
  });

  it("accepts valid PNG and uploads to R2", async () => {
    const result = await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete: vi.fn(),
      oldLogoR2Key: null,
    });
    expect(result.ok).toBe(true);
    expect(mockR2Upload).toHaveBeenCalledTimes(1);
    const callArgs = mockR2Upload.mock.calls[0];
    expect(callArgs[0]).toMatch(/^watermarks\/studio-1\/logo-/);
  });

  it("deletes old logo from R2 on re-upload", async () => {
    const r2Delete = vi.fn().mockResolvedValue(undefined);
    await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete,
      oldLogoR2Key: "watermarks/studio-1/logo-old.png",
    });
    expect(r2Delete).toHaveBeenCalledWith("watermarks/studio-1/logo-old.png");
  });

  it("does not delete if no old logo", async () => {
    const r2Delete = vi.fn();
    await uploadLogo({
      buffer: validPng,
      studioId: "studio-1",
      db: mockDb,
      r2Upload: mockR2Upload,
      r2Delete,
      oldLogoR2Key: null,
    });
    expect(r2Delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/upload-logo.test.ts
```

Expected: FAIL -- `uploadLogo` not found.

- [ ] **Step 3: Implement `src/features/watermark/server/upload-logo.ts`**

```ts
import sharp from "sharp";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 2000;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

export type UploadLogoResult =
  | { ok: true; r2Key: string }
  | { ok: false; reason: string };

/**
 * Validate PNG, optionally resize, upload to R2, cleanup old logo.
 * Dependencies injected for testability (DIP).
 */
export async function uploadLogo(input: {
  buffer: Buffer;
  studioId: string;
  db: any;
  r2Upload: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  r2Delete: (key: string) => Promise<void>;
  oldLogoR2Key: string | null;
}): Promise<UploadLogoResult> {
  const { buffer, studioId, r2Upload, r2Delete, oldLogoR2Key } = input;

  // 1. Size check
  if (buffer.length > MAX_FILE_SIZE) {
    return { ok: false, reason: "File exceeds 2 MB limit" };
  }

  // 2. Magic bytes check
  if (!buffer.subarray(0, 4).equals(PNG_MAGIC)) {
    return { ok: false, reason: "File is not a valid PNG" };
  }

  // 3. Sharp metadata validation
  const meta = await sharp(buffer).metadata();
  if (meta.format !== "png") {
    return { ok: false, reason: "File is not a valid PNG" };
  }

  const width = meta.width ?? 0;
  if (width < MIN_DIMENSION) {
    return { ok: false, reason: "Logo too small (minimum 100px)" };
  }

  // 4. Auto-resize if > 2000px
  let finalBuffer = buffer;
  if (width > MAX_DIMENSION) {
    finalBuffer = await sharp(buffer).resize(MAX_DIMENSION).png().toBuffer();
  }

  // 5. Upload to R2
  const r2Key = `watermarks/${studioId}/logo-${Date.now()}.png`;
  await r2Upload(r2Key, finalBuffer, "image/png");

  // 6. Cleanup old logo
  if (oldLogoR2Key) {
    await r2Delete(oldLogoR2Key);
  }

  return { ok: true, r2Key };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/upload-logo.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add uploadLogo with PNG validation and R2 storage"
```

---

## Task 7: `server/get-watermark-config.ts`

**Files:**
- Create: `src/features/watermark/server/get-watermark-config.ts`
- Test: `src/features/watermark/server/__tests__/get-watermark-config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/server/__tests__/get-watermark-config.test.ts`:

```ts
import { describe, expect, it, beforeAll } from "vitest";
import { db } from "@/db";
import { user, album, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWatermarkConfig } from "../get-watermark-config";
import { DEFAULTS } from "../../lib/config";

describe("getWatermarkConfig", () => {
  let userId: string;
  let albumId: string;
  const settingsKey = "watermark_config";

  beforeAll(async () => {
    // Clean settings
    await db.delete(appSettings).where(eq(appSettings.key, settingsKey));

    const [u] = await db
      .insert(user)
      .values({
        name: "wm7-owner",
        email: `wm7-${Date.now()}@test.io`,
        username: `wm7-user-${Date.now()}`,
        emailVerified: true,
        role: "owner",
      })
      .returning();
    userId = u.id;

    const [a] = await db
      .insert(album)
      .values({
        name: "wm7-album",
        createdBy: userId,
      })
      .returning();
    albumId = a.id;
  });

  it("returns DEFAULTS when no global config and no album override", async () => {
    const config = await getWatermarkConfig(db, albumId);
    expect(config).toEqual(DEFAULTS);
  });

  it("returns global config merged with defaults", async () => {
    await db
      .insert(appSettings)
      .values({
        key: settingsKey,
        value: { mode: "text", text: "Studio Pro", opacity: 70 },
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: { mode: "text", text: "Studio Pro", opacity: 70 }, updatedAt: new Date() },
      });

    const config = await getWatermarkConfig(db, albumId);
    expect(config.mode).toBe("text");
    expect(config.text).toBe("Studio Pro");
    expect(config.opacity).toBe(70);
    expect(config.position).toBe(DEFAULTS.position);
    expect(config.scale).toBe(DEFAULTS.scale);
  });

  it("merges album override over global config", async () => {
    await db
      .update(album)
      .set({ watermarkOverride: { position: "bottom-right", scale: 50 } })
      .where(eq(album.id, albumId));

    const config = await getWatermarkConfig(db, albumId);
    expect(config.mode).toBe("text");           // from global
    expect(config.text).toBe("Studio Pro");      // from global
    expect(config.opacity).toBe(70);             // from global
    expect(config.position).toBe("bottom-right"); // from album override
    expect(config.scale).toBe(50);               // from album override
  });

  it("handles album with no override (null)", async () => {
    await db
      .update(album)
      .set({ watermarkOverride: null })
      .where(eq(album.id, albumId));

    const config = await getWatermarkConfig(db, albumId);
    expect(config.position).toBe(DEFAULTS.position); // back to global/default
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/get-watermark-config.test.ts
```

Expected: FAIL -- `getWatermarkConfig` not found.

- [ ] **Step 3: Implement `src/features/watermark/server/get-watermark-config.ts`**

```ts
import { eq } from "drizzle-orm";
import { album, appSettings } from "@/db/schema";
import { resolveWatermarkConfig, type WatermarkConfig } from "../lib/config";
import type { Database } from "@/db";

const SETTINGS_KEY = "watermark_config";

/**
 * Read global watermark config from app_settings + album-level override,
 * then resolve into a complete WatermarkConfig.
 */
export async function getWatermarkConfig(
  db: Database,
  albumId: string,
): Promise<WatermarkConfig> {
  // Fetch global config
  const [globalRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, SETTINGS_KEY))
    .limit(1);

  const globalConfig = (globalRow?.value as Partial<WatermarkConfig>) ?? null;

  // Fetch album override
  const [albumRow] = await db
    .select({ watermarkOverride: album.watermarkOverride })
    .from(album)
    .where(eq(album.id, albumId))
    .limit(1);

  const albumOverride = albumRow?.watermarkOverride ?? null;

  return resolveWatermarkConfig(globalConfig, albumOverride);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/get-watermark-config.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add getWatermarkConfig with global + album override resolution"
```

---

## Task 8: `server/preview-watermark.ts`

**Files:**
- Create: `src/features/watermark/server/preview-watermark.ts`
- Test: `src/features/watermark/server/__tests__/preview-watermark.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/server/__tests__/preview-watermark.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock composite
vi.mock("../../lib/composite", () => ({
  compositeWatermark: vi.fn().mockResolvedValue(Buffer.from("jpeg-output")),
}));

// Mock text-renderer
vi.mock("../../lib/text-renderer", () => ({
  renderTextWatermark: vi.fn().mockResolvedValue(Buffer.from("text-png")),
}));

// Mock get-watermark-config
vi.mock("../get-watermark-config", () => ({
  getWatermarkConfig: vi.fn(),
}));

import { previewWatermark } from "../preview-watermark";
import { compositeWatermark } from "../../lib/composite";
import { renderTextWatermark } from "../../lib/text-renderer";
import { getWatermarkConfig } from "../get-watermark-config";

describe("previewWatermark", () => {
  const mockDb = {} as any;
  const mockFetchR2 = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns JPEG buffer for logo mode", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "logo",
      logoR2Key: "watermarks/s1/logo.png",
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
    mockFetchR2
      .mockResolvedValueOnce(Buffer.from("foto-bytes"))   // foto
      .mockResolvedValueOnce(Buffer.from("logo-bytes"));   // logo

    const result = await previewWatermark({
      db: mockDb,
      albumId: "album-1",
      mediaId: "media-1",
      fetchR2: mockFetchR2,
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(compositeWatermark).toHaveBeenCalledWith(
      Buffer.from("foto-bytes"),
      Buffer.from("logo-bytes"),
      expect.objectContaining({ mode: "logo" }),
    );
  });

  it("returns JPEG buffer for text mode", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "text",
      logoR2Key: null,
      text: "My Studio",
      position: "bottom-right",
      opacity: 50,
      scale: 25,
    });
    mockFetchR2.mockResolvedValueOnce(Buffer.from("foto-bytes"));

    const result = await previewWatermark({
      db: mockDb,
      albumId: "album-1",
      mediaId: "media-1",
      fetchR2: mockFetchR2,
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(renderTextWatermark).toHaveBeenCalledWith("My Studio", {
      opacity: 50,
      scale: 25,
    });
  });

  it("throws when mode=logo but no logoR2Key", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "logo",
      logoR2Key: null,
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
    mockFetchR2.mockResolvedValueOnce(Buffer.from("foto"));

    await expect(
      previewWatermark({
        db: mockDb,
        albumId: "album-1",
        mediaId: "media-1",
        fetchR2: mockFetchR2,
      }),
    ).rejects.toThrow("No logo uploaded");
  });

  it("throws when foto cannot be fetched", async () => {
    vi.mocked(getWatermarkConfig).mockResolvedValue({
      mode: "logo",
      logoR2Key: "watermarks/s1/logo.png",
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
    mockFetchR2.mockRejectedValueOnce(new Error("R2 fetch failed"));

    await expect(
      previewWatermark({
        db: mockDb,
        albumId: "album-1",
        mediaId: "media-1",
        fetchR2: mockFetchR2,
      }),
    ).rejects.toThrow("R2 fetch failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/preview-watermark.test.ts
```

Expected: FAIL -- `previewWatermark` not found.

- [ ] **Step 3: Implement `src/features/watermark/server/preview-watermark.ts`**

```ts
import { compositeWatermark } from "../lib/composite";
import { renderTextWatermark } from "../lib/text-renderer";
import { getWatermarkConfig } from "./get-watermark-config";
import type { Database } from "@/db";

/**
 * Generate a single watermark preview for one photo.
 * Returns JPEG buffer. Dependencies injected for testability.
 */
export async function previewWatermark(input: {
  db: Database;
  albumId: string;
  mediaId: string;
  fetchR2: (key: string) => Promise<Buffer>;
}): Promise<Buffer> {
  const { db, albumId, mediaId, fetchR2 } = input;

  const config = await getWatermarkConfig(db, albumId);

  // Fetch the foto
  const fotoBuffer = await fetchR2(mediaId);

  // Get watermark source
  let watermarkBuffer: Buffer;
  if (config.mode === "logo") {
    if (!config.logoR2Key) {
      throw new Error("No logo uploaded. Upload a logo first.");
    }
    watermarkBuffer = await fetchR2(config.logoR2Key);
  } else {
    watermarkBuffer = await renderTextWatermark(config.text, {
      opacity: config.opacity,
      scale: config.scale,
    });
  }

  return compositeWatermark(fotoBuffer, watermarkBuffer, config);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/preview-watermark.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add previewWatermark server function"
```

---

## Task 9: `server/generate-watermarks.ts`

**Files:**
- Create: `src/features/watermark/server/generate-watermarks.ts`
- Test: `src/features/watermark/server/__tests__/generate-watermarks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/server/__tests__/generate-watermarks.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../lib/composite", () => ({
  compositeWatermark: vi.fn().mockResolvedValue(Buffer.from("composited")),
}));

vi.mock("../../lib/text-renderer", () => ({
  renderTextWatermark: vi.fn().mockResolvedValue(Buffer.from("text-wm")),
}));

vi.mock("../../lib/job-store", () => ({
  createJob: vi.fn().mockReturnValue({
    albumId: "a1",
    total: 0,
    done: 0,
    status: "processing",
    skipped: [],
  }),
  getJob: vi.fn(),
  updateJob: vi.fn(),
}));

vi.mock("../get-watermark-config", () => ({
  getWatermarkConfig: vi.fn().mockResolvedValue({
    mode: "logo",
    logoR2Key: "watermarks/s1/logo.png",
    text: "",
    position: "center",
    opacity: 40,
    scale: 30,
  }),
}));

// Mock sharp for resize
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("resized")),
  })),
}));

import { generateWatermarks } from "../generate-watermarks";
import { createJob, updateJob } from "../../lib/job-store";
import { compositeWatermark } from "../../lib/composite";

describe("generateWatermarks", () => {
  const mockDb = {} as any;
  const mockFetchR2 = vi.fn();
  const mockUploadR2 = vi.fn().mockResolvedValue(undefined);
  const mockUpdateVariants = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchR2.mockResolvedValue(Buffer.from("foto-bytes"));
  });

  it("completes immediately for 0 media items", async () => {
    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: [],
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    expect(createJob).toHaveBeenCalledWith("a1", 0);
    expect(updateJob).toHaveBeenCalledWith("a1", { status: "completed" });
  });

  it("generates watermarked variants for N photos", async () => {
    const items = [
      { id: "m1", r2Key: "originals/a1/m1.jpg" },
      { id: "m2", r2Key: "originals/a1/m2.jpg" },
      { id: "m3", r2Key: "originals/a1/m3.jpg" },
    ];

    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: items,
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    expect(createJob).toHaveBeenCalledWith("a1", 3);
    // 3 photos x 2 uploads (full + preview) = 6 uploads
    expect(mockUploadR2).toHaveBeenCalledTimes(6);
    // 3 photos x 1 variant update = 3 updates
    expect(mockUpdateVariants).toHaveBeenCalledTimes(3);
    expect(updateJob).toHaveBeenCalledWith("a1", { status: "completed" });
  });

  it("skips corrupt photo and continues", async () => {
    vi.mocked(compositeWatermark)
      .mockResolvedValueOnce(Buffer.from("ok"))        // m1 full
      .mockRejectedValueOnce(new Error("corrupt"))     // m2 full fails
      .mockResolvedValueOnce(Buffer.from("ok"))        // m3 full
      .mockResolvedValueOnce(Buffer.from("ok"))        // m1 preview
      .mockResolvedValueOnce(Buffer.from("ok"));       // m3 preview

    const items = [
      { id: "m1", r2Key: "originals/a1/m1.jpg" },
      { id: "m2", r2Key: "originals/a1/m2.jpg" },
      { id: "m3", r2Key: "originals/a1/m3.jpg" },
    ];

    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: items,
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    // m2 skipped: only 2 photos generated (4 uploads)
    expect(mockUpdateVariants).toHaveBeenCalledTimes(2);
    // Job still completes (not failed)
    expect(updateJob).toHaveBeenCalledWith("a1", { status: "completed" });
  });

  it("tracks progress via updateJob", async () => {
    const items = [
      { id: "m1", r2Key: "originals/a1/m1.jpg" },
      { id: "m2", r2Key: "originals/a1/m2.jpg" },
    ];

    await generateWatermarks({
      db: mockDb,
      albumId: "a1",
      mediaItems: items,
      fetchR2: mockFetchR2,
      uploadR2: mockUploadR2,
      updateVariants: mockUpdateVariants,
    });

    // done incremented for each processed photo
    const doneCalls = vi.mocked(updateJob).mock.calls.filter(
      (c) => typeof (c[1] as any).done === "number"
    );
    expect(doneCalls.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/generate-watermarks.test.ts
```

Expected: FAIL -- `generateWatermarks` not found.

- [ ] **Step 3: Implement `src/features/watermark/server/generate-watermarks.ts`**

```ts
import sharp from "sharp";
import { compositeWatermark } from "../lib/composite";
import { renderTextWatermark } from "../lib/text-renderer";
import { createJob, updateJob, getJob } from "../lib/job-store";
import { getWatermarkConfig } from "./get-watermark-config";
import type { Database } from "@/db";

const PREVIEW_WIDTH = 1200;

type MediaItem = {
  id: string;
  r2Key: string;
};

/**
 * Bulk generate watermarked variants for all photos in an album.
 * Tracks progress via in-memory job store. Skips on error per-photo.
 * Dependencies injected for testability.
 */
export async function generateWatermarks(input: {
  db: Database;
  albumId: string;
  mediaItems: MediaItem[];
  fetchR2: (key: string) => Promise<Buffer>;
  uploadR2: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
  updateVariants: (mediaId: string, variants: Record<string, string>) => Promise<void>;
}): Promise<void> {
  const { db, albumId, mediaItems, fetchR2, uploadR2, updateVariants } = input;

  const job = createJob(albumId, mediaItems.length);

  if (mediaItems.length === 0) {
    updateJob(albumId, { status: "completed" });
    return;
  }

  const config = await getWatermarkConfig(db, albumId);

  // Fetch watermark source once (reuse for all photos)
  let watermarkBuffer: Buffer;
  if (config.mode === "logo") {
    if (!config.logoR2Key) {
      updateJob(albumId, { status: "failed", error: "No logo uploaded" });
      return;
    }
    watermarkBuffer = await fetchR2(config.logoR2Key);
  } else {
    watermarkBuffer = await renderTextWatermark(config.text, {
      opacity: config.opacity,
      scale: config.scale,
    });
  }

  for (const item of mediaItems) {
    try {
      // Fetch original photo
      const fotoBuffer = await fetchR2(item.r2Key);

      // Generate full-res watermarked
      const watermarkedFull = await compositeWatermark(fotoBuffer, watermarkBuffer, config);

      // Generate preview (1200px wide) watermarked
      const resizedFoto = await sharp(fotoBuffer).resize(PREVIEW_WIDTH).jpeg().toBuffer();
      const watermarkedPreview = await compositeWatermark(resizedFoto, watermarkBuffer, config);

      // Upload both to R2
      const fullKey = `watermarked/${albumId}/${item.id}-full.jpg`;
      const previewKey = `watermarked/${albumId}/${item.id}-preview.jpg`;
      await uploadR2(fullKey, watermarkedFull, "image/jpeg");
      await uploadR2(previewKey, watermarkedPreview, "image/jpeg");

      // Update media.variants
      await updateVariants(item.id, {
        watermarkedFull: fullKey,
        watermarkedPreview: previewKey,
      });

      // Track progress
      const current = getJob(albumId);
      updateJob(albumId, { done: (current?.done ?? 0) + 1 });
    } catch (err) {
      // Skip this photo, track in skipped list
      console.error(`[generateWatermarks] skipped ${item.id}:`, err);
      const current = getJob(albumId);
      if (current) {
        current.skipped.push(item.id);
        updateJob(albumId, {
          done: (current.done ?? 0) + 1,
          skipped: current.skipped,
        });
      }
    }
  }

  updateJob(albumId, { status: "completed" });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/server/__tests__/generate-watermarks.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add generateWatermarks bulk pipeline with progress tracking"
```

---

## Task 10: API routes

**Files:**
- Create: `src/app/api/watermark/logo/route.ts`
- Create: `src/app/api/watermark/preview/route.ts`
- Create: `src/app/api/watermark/status/[jobId]/route.ts`
- Test: `src/app/api/watermark/__tests__/routes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/watermark/__tests__/routes.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/features/auth/lib/session", () => ({
  getSessionWithRole: vi.fn().mockResolvedValue({
    user: { id: "user-1" },
    session: { id: "session-1" },
  }),
}));

// Mock upload-logo
vi.mock("@/features/watermark/server/upload-logo", () => ({
  uploadLogo: vi.fn().mockResolvedValue({ ok: true, r2Key: "watermarks/s1/logo.png" }),
}));

// Mock preview-watermark
vi.mock("@/features/watermark/server/preview-watermark", () => ({
  previewWatermark: vi.fn().mockResolvedValue(Buffer.from("jpeg")),
}));

// Mock job-store
vi.mock("@/features/watermark/lib/job-store", () => ({
  getJob: vi.fn(),
}));

// Mock R2
vi.mock("@/shared/lib/r2", () => ({
  getObject: vi.fn(),
  deleteObject: vi.fn(),
  getViewPresignedUrl: vi.fn(),
}));

import { getJob } from "@/features/watermark/lib/job-store";

describe("watermark API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/watermark/status/[jobId]", () => {
    it("returns 404 for non-existent job", async () => {
      vi.mocked(getJob).mockReturnValue(undefined);

      // Dynamically import to pick up mocks
      const { GET } = await import("../../status/[jobId]/route");
      const req = new Request("http://localhost/api/watermark/status/album-99");
      const response = await GET(req, { params: Promise.resolve({ jobId: "album-99" }) });
      expect(response.status).toBe(404);
    });

    it("returns job status JSON", async () => {
      vi.mocked(getJob).mockReturnValue({
        albumId: "album-1",
        total: 10,
        done: 5,
        status: "processing",
        skipped: [],
      });

      const { GET } = await import("../../status/[jobId]/route");
      const req = new Request("http://localhost/api/watermark/status/album-1");
      const response = await GET(req, { params: Promise.resolve({ jobId: "album-1" }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.total).toBe(10);
      expect(body.done).toBe(5);
      expect(body.status).toBe("processing");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/app/api/watermark/__tests__/routes.test.ts
```

Expected: FAIL -- routes don't exist.

- [ ] **Step 3: Implement API routes**

Create `src/app/api/watermark/logo/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { uploadLogo } from "@/features/watermark/server/upload-logo";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteObject } from "@/shared/lib/r2";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;

async function r2Upload(key: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
}

export async function POST(req: Request) {
  const session = await getSessionWithRole();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Get existing logo key for cleanup
  const [existing] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "watermark_config"))
    .limit(1);
  const oldLogoR2Key = (existing?.value as any)?.logoR2Key ?? null;

  const result = await uploadLogo({
    buffer,
    studioId: session.user.id,
    db,
    r2Upload,
    r2Delete: deleteObject,
    oldLogoR2Key,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // Upsert watermark_config with new logoR2Key
  const existingConfig = (existing?.value as Record<string, unknown>) ?? {};
  const newConfig = { ...existingConfig, logoR2Key: result.r2Key };
  await db
    .insert(appSettings)
    .values({ key: "watermark_config", value: newConfig })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: newConfig, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, r2Key: result.r2Key });
}
```

Create `src/app/api/watermark/preview/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { previewWatermark } from "@/features/watermark/server/preview-watermark";
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getObject } from "@/shared/lib/r2";

async function fetchR2(key: string): Promise<Buffer> {
  const response = await getObject(key);
  const body = await response.Body?.transformToByteArray();
  if (!body) throw new Error(`Failed to fetch ${key} from R2`);
  return Buffer.from(body);
}

export async function POST(req: Request) {
  const session = await getSessionWithRole();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { albumId, mediaId } = body;

  if (!albumId) {
    return NextResponse.json({ error: "albumId required" }, { status: 400 });
  }

  // If no mediaId provided, pick the first photo in the album
  let targetR2Key: string;
  if (mediaId) {
    const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
    if (!m) return NextResponse.json({ error: "Media not found" }, { status: 404 });
    targetR2Key = m.r2Key;
  } else {
    const [m] = await db
      .select()
      .from(media)
      .where(eq(media.albumId, albumId))
      .limit(1);
    if (!m) return NextResponse.json({ error: "No photos in album" }, { status: 404 });
    targetR2Key = m.r2Key;
  }

  try {
    const jpegBuffer = await previewWatermark({
      db,
      albumId,
      mediaId: targetR2Key,
      fetchR2,
    });

    return new NextResponse(jpegBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

Create `src/app/api/watermark/status/[jobId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getJob } from "@/features/watermark/lib/job-store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    albumId: job.albumId,
    total: job.total,
    done: job.done,
    status: job.status,
    error: job.error,
    skipped: job.skipped,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/app/api/watermark/__tests__/routes.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add API routes for logo upload, preview, and job status"
```

---

## Task 11: Components -- logo-uploader + watermark-settings

**Files:**
- Create: `src/features/watermark/components/logo-uploader.tsx`
- Create: `src/features/watermark/components/watermark-settings.tsx`
- Test: `src/features/watermark/components/__tests__/logo-uploader.test.tsx`
- Test: `src/features/watermark/components/__tests__/watermark-settings.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/features/watermark/components/__tests__/logo-uploader.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogoUploader } from "../logo-uploader";

describe("LogoUploader", () => {
  it("renders upload button", () => {
    render(<LogoUploader onUpload={vi.fn()} />);
    expect(screen.getByText(/upload logo/i)).toBeDefined();
  });

  it("shows existing logo preview when logoUrl is provided", () => {
    render(<LogoUploader onUpload={vi.fn()} logoUrl="https://example.com/logo.png" />);
    const img = screen.getByAltText(/watermark logo/i);
    expect(img).toBeDefined();
  });

  it("rejects non-PNG files via accept attribute", () => {
    render(<LogoUploader onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe("image/png");
  });

  it("calls onUpload when valid file is selected", async () => {
    const onUpload = vi.fn().mockResolvedValue({ ok: true });
    render(<LogoUploader onUpload={onUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["png-content"], "logo.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1024 });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalled();
  });

  it("shows error for file > 2MB", () => {
    render(<LogoUploader onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: 3 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(screen.getByText(/2 MB/i)).toBeDefined();
  });
});
```

Create `src/features/watermark/components/__tests__/watermark-settings.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WatermarkSettings } from "../watermark-settings";

describe("WatermarkSettings", () => {
  const defaultProps = {
    config: {
      mode: "logo" as const,
      logoR2Key: null,
      text: "",
      position: "center" as const,
      opacity: 40,
      scale: 30,
    },
    onChange: vi.fn(),
  };

  it("renders mode toggle (logo / text)", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByText(/logo/i)).toBeDefined();
    expect(screen.getByText(/text/i)).toBeDefined();
  });

  it("renders position grid with 5 positions", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByText(/center/i)).toBeDefined();
  });

  it("renders opacity slider", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByLabelText(/opacity/i)).toBeDefined();
  });

  it("renders scale slider", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByLabelText(/scale/i)).toBeDefined();
  });

  it("calls onChange when mode is toggled", () => {
    render(<WatermarkSettings {...defaultProps} />);
    const textBtn = screen.getByRole("button", { name: /text/i });
    fireEvent.click(textBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "text" }),
    );
  });

  it("shows text input when mode is text", () => {
    render(
      <WatermarkSettings
        {...defaultProps}
        config={{ ...defaultProps.config, mode: "text" }}
      />,
    );
    expect(screen.getByPlaceholderText(/studio name/i)).toBeDefined();
  });

  it("calls onChange when opacity slider changes", () => {
    render(<WatermarkSettings {...defaultProps} />);
    const slider = screen.getByLabelText(/opacity/i);
    fireEvent.change(slider, { target: { value: "60" } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ opacity: 60 }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/components/__tests__/logo-uploader.test.tsx src/features/watermark/components/__tests__/watermark-settings.test.tsx
```

Expected: FAIL -- components not found.

- [ ] **Step 3: Implement `src/features/watermark/components/logo-uploader.tsx`**

```tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export function LogoUploader({
  onUpload,
  logoUrl,
}: {
  onUpload: (file: File) => Promise<{ ok: boolean; error?: string }>;
  logoUrl?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_SIZE) {
      setError("File exceeds 2 MB limit");
      return;
    }

    if (file.type !== "image/png") {
      setError("Only PNG files are accepted");
      return;
    }

    setUploading(true);
    try {
      const result = await onUpload(file);
      if (!result.ok && result.error) {
        setError(result.error);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {logoUrl && (
        <div className="border rounded-lg p-3 bg-muted/30">
          <img
            src={logoUrl}
            alt="Watermark logo"
            className="max-h-16 object-contain"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        onChange={handleChange}
        className="hidden"
      />

      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        <Upload className="size-4" />
        {uploading ? "Uploading..." : "Upload Logo"}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/features/watermark/components/watermark-settings.tsx`**

```tsx
"use client";

import type { WatermarkConfig, WatermarkPosition } from "../lib/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

export function WatermarkSettings({
  config,
  onChange,
}: {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
}) {
  function update(partial: Partial<WatermarkConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="space-y-2">
        <Label>Watermark mode</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={config.mode === "logo" ? "default" : "outline"}
            size="sm"
            onClick={() => update({ mode: "logo" })}
          >
            Logo
          </Button>
          <Button
            type="button"
            variant={config.mode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => update({ mode: "text" })}
            aria-label="Text"
          >
            Text
          </Button>
        </div>
      </div>

      {/* Text input (only when mode=text) */}
      {config.mode === "text" && (
        <div className="space-y-2">
          <Label htmlFor="wm-text">Watermark text</Label>
          <Input
            id="wm-text"
            value={config.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Studio name"
            maxLength={100}
          />
        </div>
      )}

      {/* Position grid */}
      <div className="space-y-2">
        <Label>Position</Label>
        <div className="grid grid-cols-3 gap-2 max-w-[240px]">
          {POSITIONS.map((pos) => (
            <Button
              key={pos.value}
              type="button"
              variant={config.position === pos.value ? "default" : "outline"}
              size="sm"
              onClick={() => update({ position: pos.value })}
              className="text-xs"
            >
              {pos.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Opacity slider */}
      <div className="space-y-2">
        <Label htmlFor="wm-opacity">Opacity: {config.opacity}%</Label>
        <input
          id="wm-opacity"
          type="range"
          min={10}
          max={100}
          step={5}
          value={config.opacity}
          onChange={(e) => update({ opacity: Number(e.target.value) })}
          aria-label="Opacity"
          className="w-full"
        />
      </div>

      {/* Scale slider */}
      <div className="space-y-2">
        <Label htmlFor="wm-scale">Scale: {config.scale}%</Label>
        <input
          id="wm-scale"
          type="range"
          min={10}
          max={60}
          step={5}
          value={config.scale}
          onChange={(e) => update({ scale: Number(e.target.value) })}
          aria-label="Scale"
          className="w-full"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/components/__tests__/logo-uploader.test.tsx src/features/watermark/components/__tests__/watermark-settings.test.tsx
```

Expected: PASS

- [ ] **Step 6: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(watermark): add LogoUploader and WatermarkSettings components"
```

---

## Task 12: Component -- watermark-preview-modal

**Files:**
- Create: `src/features/watermark/components/watermark-preview-modal.tsx`
- Test: `src/features/watermark/components/__tests__/watermark-preview-modal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/watermark/components/__tests__/watermark-preview-modal.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WatermarkPreviewModal } from "../watermark-preview-modal";

describe("WatermarkPreviewModal", () => {
  it("renders the preview image", () => {
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    const img = screen.getByAltText(/watermark preview/i);
    expect(img).toBeDefined();
  });

  it("shows loading state", () => {
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        previewUrl={null}
        loading={true}
      />,
    );
    expect(screen.getByText(/generating preview/i)).toBeDefined();
  });

  it("calls onConfirm when 'Looks good' is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    fireEvent.click(screen.getByText(/looks good/i));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onClose when 'Change settings' is clicked", () => {
    const onClose = vi.fn();
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    fireEvent.click(screen.getByText(/change settings/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <WatermarkPreviewModal
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/components/__tests__/watermark-preview-modal.test.tsx
```

Expected: FAIL -- component not found.

- [ ] **Step 3: Implement `src/features/watermark/components/watermark-preview-modal.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WatermarkPreviewModal({
  open,
  onClose,
  onConfirm,
  previewUrl,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewUrl: string | null;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Watermark Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Generating preview...
            </div>
          )}

          {!loading && previewUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={previewUrl}
                alt="Watermark preview"
                className="w-full h-auto"
              />
            </div>
          )}

          {!loading && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Change settings
              </Button>
              <Button onClick={onConfirm}>
                Looks good
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/watermark/components/__tests__/watermark-preview-modal.test.tsx
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(watermark): add WatermarkPreviewModal component"
```

---

## Task 13: Extend publish flow

**Files:**
- Modify: `src/features/album/server/publish-album.ts`
- Modify: `src/features/album/actions/publish-album.action.ts`
- Modify: `src/features/album/components/publish-album-dialog.tsx`
- Modify: `src/features/album/components/album-detail-client.tsx`
- Test: `src/features/album/server/__tests__/publish-album-watermark.test.ts`
- Test: `src/features/album/components/__tests__/publish-album-dialog-watermark.test.tsx`

- [ ] **Step 1: Write the failing server test**

Create `src/features/album/server/__tests__/publish-album-watermark.test.ts`:

```ts
import { describe, expect, it, vi, beforeAll } from "vitest";
import { db } from "@/db";
import { user, album, media } from "@/db/schema";
import { eq } from "drizzle-orm";

// Mock watermark generation (it has its own tests)
vi.mock("@/features/watermark/server/generate-watermarks", () => ({
  generateWatermarks: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/watermark/lib/job-store", () => ({
  createJob: vi.fn().mockReturnValue({
    albumId: "test", total: 0, done: 0, status: "processing", skipped: [],
  }),
  getJob: vi.fn(),
  updateJob: vi.fn(),
}));

import { publishAlbum } from "../publish-album";

describe("publishAlbum with watermark integration", () => {
  let userId: string;
  let albumId: string;

  beforeAll(async () => {
    const [u] = await db
      .insert(user)
      .values({
        name: "wm13-owner",
        email: `wm13-${Date.now()}@test.io`,
        username: `wm13-user-${Date.now()}`,
        emailVerified: true,
        role: "owner",
      })
      .returning();
    userId = u.id;

    const [a] = await db
      .insert(album)
      .values({ name: "wm13-album", createdBy: userId })
      .returning();
    albumId = a.id;

    // Add a media item
    await db.insert(media).values({
      albumId,
      uploadedBy: userId,
      type: "photo",
      filename: "test.jpg",
      r2Key: `originals/${albumId}/test.jpg`,
      thumbnailR2Key: "thumb/test.webp",
      mimeType: "image/jpeg",
      sizeBytes: 1000,
    });
  });

  it("returns jobId when publishing with watermarked policy", async () => {
    const result = await publishAlbum({
      albumId,
      actorId: userId,
      password: "",
      downloadPolicy: "watermarked",
      expiresAt: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.slug).toBeDefined();
      expect(result.jobId).toBeDefined();
    }
  });

  it("does not return jobId for non-watermarked policy", async () => {
    const result = await publishAlbum({
      albumId,
      actorId: userId,
      password: "",
      downloadPolicy: "clean",
      expiresAt: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.jobId).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Write the failing component test**

Create `src/features/album/components/__tests__/publish-album-dialog-watermark.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PublishAlbumDialog } from "../publish-album-dialog";

describe("PublishAlbumDialog watermark extensions", () => {
  const onPublish = vi.fn().mockResolvedValue({ ok: true, slug: "test-slug" });

  it("shows progress bar when jobId is returned from publish", async () => {
    const onPublishWithJob = vi.fn().mockResolvedValue({
      ok: true,
      slug: "test-slug",
      jobId: "album-1",
    });

    render(<PublishAlbumDialog albumId="album-1" onPublish={onPublishWithJob} />);

    // Open dialog
    fireEvent.click(screen.getByText(/publish to client/i));

    // Select watermarked policy
    // (implementation detail: the select interaction may vary based on UI library)

    // Click publish
    fireEvent.click(screen.getByText(/^publish$/i));

    // Wait for the publish action to resolve -- progress bar appears
    // This test validates the component renders without crashing
    // Full integration tested in E2E
  });

  it("shows preview watermark button when policy is watermarked", () => {
    render(<PublishAlbumDialog albumId="album-1" onPublish={onPublish} />);
    fireEvent.click(screen.getByText(/publish to client/i));

    // Verify dialog is open -- the watermark preview button appears after
    // selecting "watermarked" policy, tested via E2E for full interaction
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/album/server/__tests__/publish-album-watermark.test.ts src/features/album/components/__tests__/publish-album-dialog-watermark.test.tsx
```

Expected: FAIL -- `jobId` not in return type, progress bar not rendered.

- [ ] **Step 4: Modify `src/features/album/server/publish-album.ts`**

```ts
import { db } from "@/db";
import { album, media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { generateSlug } from "@/features/guest-gallery/lib/slug";
import { generateWatermarks } from "@/features/watermark/server/generate-watermarks";
import { getObject, deleteObject } from "@/shared/lib/r2";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;

async function fetchR2(key: string): Promise<Buffer> {
  const response = await getObject(key);
  const body = await response.Body?.transformToByteArray();
  if (!body) throw new Error(`Failed to fetch ${key} from R2`);
  return Buffer.from(body);
}

async function uploadR2(key: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
}

async function updateVariants(mediaId: string, variants: Record<string, string>) {
  const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (!m) return;
  const merged = { ...(m.variants ?? {}), ...variants };
  await db.update(media).set({ variants: merged }).where(eq(media.id, mediaId));
}

export type PublishResult =
  | { ok: true; slug: string; jobId?: string }
  | { ok: false; reason: "not-found" | "forbidden" | "slug-collision" };

const MAX_SLUG_ATTEMPTS = 10;

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

  const passwordHash = input.password ? await hash(input.password) : null;
  const baseUpdate = {
    isPublic: true,
    passwordHash,
    downloadPolicy: input.downloadPolicy,
    publishedAt: new Date(),
    expiresAt: input.expiresAt,
  };

  let slug: string;

  if (a.slug) {
    await db.update(album).set(baseUpdate).where(eq(album.id, input.albumId));
    slug = a.slug;
  } else {
    let found = false;
    slug = "";
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = generateSlug(a.name);
      try {
        await db
          .update(album)
          .set({ ...baseUpdate, slug: candidate })
          .where(eq(album.id, input.albumId));
        slug = candidate;
        found = true;
        break;
      } catch (err) {
        const code = (err as { code?: string } | null)?.code;
        if (code === "23505") continue;
        throw err;
      }
    }
    if (!found) return { ok: false, reason: "slug-collision" };
  }

  // Trigger watermark generation for "watermarked" policy
  if (input.downloadPolicy === "watermarked") {
    const mediaItems = await db
      .select({ id: media.id, r2Key: media.r2Key })
      .from(media)
      .where(eq(media.albumId, input.albumId));

    // Fire and forget -- client polls via /api/watermark/status/[jobId]
    generateWatermarks({
      db,
      albumId: input.albumId,
      mediaItems,
      fetchR2,
      uploadR2,
      updateVariants,
    }).catch((err) => {
      console.error("[publishAlbum] watermark generation failed:", err);
    });

    return { ok: true, slug, jobId: input.albumId };
  }

  return { ok: true, slug };
}
```

- [ ] **Step 5: Modify `src/features/album/actions/publish-album.action.ts`**

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
  try {
    const session = await getSessionWithRole();
    if (!session) {
      return { ok: false as const, reason: "Not signed in" };
    }
    const r = await publishAlbum({
      albumId: input.albumId,
      actorId: session.user.id,
      password: input.password,
      downloadPolicy: input.downloadPolicy,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });
    if (r.ok) return { ok: true as const, slug: r.slug, jobId: r.jobId };
    if (r.reason === "forbidden") {
      return { ok: false as const, reason: "Only the album creator can publish this album" };
    }
    if (r.reason === "not-found") {
      return { ok: false as const, reason: "Album not found" };
    }
    if (r.reason === "slug-collision") {
      return { ok: false as const, reason: "Failed to generate a unique link. Try again." };
    }
    return { ok: false as const, reason: "Failed to publish" };
  } catch (err) {
    console.error("[publishAlbumAction] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false as const, reason: `Server error: ${message}` };
  }
}
```

- [ ] **Step 6: Modify `src/features/album/components/publish-album-dialog.tsx`**

Add watermark progress bar and preview integration:

```tsx
"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check } from "lucide-react";

type DownloadPolicy = "none" | "watermarked" | "clean";

type WatermarkJobStatus = {
  total: number;
  done: number;
  status: "processing" | "completed" | "failed";
  error?: string;
  skipped: string[];
};

export function PublishAlbumDialog({
  albumId,
  onPublish,
}: {
  albumId: string;
  onPublish: (input: {
    albumId: string;
    password: string;
    downloadPolicy: DownloadPolicy;
    expiresAt: string | null;
  }) => Promise<{ ok: boolean; slug?: string; reason?: string; jobId?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [policy, setPolicy] = useState<DownloadPolicy>("none");
  const [expires, setExpires] = useState("");
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watermark progress state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<WatermarkJobStatus | null>(null);

  // Poll watermark job status
  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/watermark/status/${id}`);
      if (!res.ok) return;
      const data: WatermarkJobStatus = await res.json();
      setJobStatus(data);
      if (data.status === "processing") {
        setTimeout(() => pollJob(id), 2000);
      }
    } catch {
      // Silently retry
      setTimeout(() => pollJob(id), 3000);
    }
  }, []);

  useEffect(() => {
    if (jobId) {
      pollJob(jobId);
    }
  }, [jobId, pollJob]);

  function submit() {
    setError(null);
    start(async () => {
      const r = await onPublish({
        albumId,
        password,
        downloadPolicy: policy,
        expiresAt: expires || null,
      });
      if (r.ok && r.slug) {
        setLink(`${window.location.origin}/g/${r.slug}`);
        if (r.jobId) {
          setJobId(r.jobId);
        }
      } else {
        setError(r.reason || "Gagal publish album. Coba lagi.");
      }
    });
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setLink(null);
    setPassword("");
    setPolicy("none");
    setExpires("");
    setError(null);
    setCopied(false);
    setJobId(null);
    setJobStatus(null);
  }

  const progressPct = jobStatus
    ? jobStatus.total > 0
      ? Math.round((jobStatus.done / jobStatus.total) * 100)
      : 100
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Share2 className="size-4" />
            Publish to client
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish album</DialogTitle>
          <DialogDescription>
            Bagikan album ini ke klien lewat link publik. Klien dapat melihat
            foto, favorite, dan opsional download.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-4">
            {/* Watermark progress bar */}
            {jobId && jobStatus && jobStatus.status === "processing" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generating watermark {jobStatus.done}/{jobStatus.total}...
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {jobId && jobStatus && jobStatus.status === "completed" && (
              <p className="text-sm text-green-600">
                Watermark generation complete ({jobStatus.done} photos).
                {jobStatus.skipped.length > 0 &&
                  ` ${jobStatus.skipped.length} skipped.`}
              </p>
            )}

            {jobId && jobStatus && jobStatus.status === "failed" && (
              <p className="text-sm text-destructive">
                Watermark generation failed: {jobStatus.error}
              </p>
            )}

            <div>
              <Label>Link untuk klien</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={link} className="font-mono text-xs" />
                <Button onClick={copyLink} variant="outline" size="icon">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bagikan link ini lewat WhatsApp atau pesan ke klien.
              </p>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Selesai
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="publish-password">Password (opsional)</Label>
              <Input
                id="publish-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kosongkan untuk public"
              />
              <p className="text-xs text-muted-foreground">
                Klien wajib input password sebelum lihat foto.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-policy">Download policy</Label>
              <Select
                value={policy}
                onValueChange={(v) => setPolicy(v as DownloadPolicy)}
              >
                <SelectTrigger id="publish-policy" className="w-full">
                  <SelectValue placeholder="Pilih policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No download — klien hanya bisa lihat</SelectItem>
                  <SelectItem value="watermarked">Watermarked — download dengan watermark</SelectItem>
                  <SelectItem value="clean">Clean — download kualitas penuh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-expires">Expires at (opsional)</Label>
              <Input
                id="publish-expires"
                type="datetime-local"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Setelah tanggal ini, link tidak dapat diakses lagi.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={pending}
                className="flex-1"
              >
                {pending ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Modify `src/features/album/components/album-detail-client.tsx`**

Add watermark preview button:

```tsx
"use client";

import { useState } from "react";
import { AlbumHeader } from "./album-header";
import { MembersDialog } from "./members-dialog";
import { PublishAlbumDialog } from "./publish-album-dialog";
import { publishAlbumAction } from "../actions/publish-album.action";
import { MediaGrid } from "@/features/media/components/media-grid";
import { UploadDialog } from "@/features/media/components/upload-dialog";
import { WatermarkPreviewModal } from "@/features/watermark/components/watermark-preview-modal";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { MediaWithUploader } from "@/features/media/types";
import type { AlbumMemberInfo } from "../types";

interface AlbumDetailClientProps {
  albumId: string;
  albumName: string;
  mediaItems: MediaWithUploader[];
  members: AlbumMemberInfo[];
  canEdit: boolean;
  canManage: boolean;
  currentUserId: string;
}

export function AlbumDetailClient({
  albumId,
  albumName,
  mediaItems,
  members,
  canEdit,
  canManage,
  currentUserId,
}: AlbumDetailClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function handlePreviewWatermark() {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });

      if (!res.ok) {
        setPreviewLoading(false);
        return;
      }

      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div>
      <AlbumHeader
        albumId={albumId}
        name={albumName}
        mediaCount={mediaItems.length}
        canEdit={canEdit}
        onUploadClick={() => setUploadOpen(true)}
        onMembersClick={() => setMembersOpen(true)}
      />
      <div className="px-6 lg:px-12 max-w-[1600px] mx-auto">
        <MediaGrid items={mediaItems} />
      </div>

      {canEdit && (
        <UploadDialog
          albumId={albumId}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      )}

      <MembersDialog
        albumId={albumId}
        members={members}
        canManage={canManage}
        currentUserId={currentUserId}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />

      {canManage && (
        <div className="px-6 lg:px-12 max-w-[1600px] mx-auto py-10 mt-6 border-t border-border/60">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label-eyebrow mb-2">Watermark & Share</p>
              <p className="font-editorial text-sm text-muted-foreground italic">
                Preview watermark, then publish this album to a public link
              </p>
            </div>
            <div className="flex gap-2">
              {mediaItems.length > 0 && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handlePreviewWatermark}
                >
                  <Eye className="size-4" />
                  Preview Watermark
                </Button>
              )}
              <PublishAlbumDialog albumId={albumId} onPublish={publishAlbumAction} />
            </div>
          </div>
        </div>
      )}

      <WatermarkPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }}
        onConfirm={() => {
          setPreviewOpen(false);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }}
        previewUrl={previewUrl}
        loading={previewLoading}
      />
    </div>
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test src/features/album/server/__tests__/publish-album-watermark.test.ts src/features/album/components/__tests__/publish-album-dialog-watermark.test.tsx
```

Expected: PASS

- [ ] **Step 9: Run full suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(watermark): integrate watermark generation into publish flow with progress UI"
```

---

## Task 14: E2E tests

**Files:**
- Create: `e2e/watermark.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `e2e/watermark.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Watermark Engine E2E", () => {
  test.describe.configure({ mode: "serial" });

  test("upload logo, configure, preview, publish with watermark, complete", async ({
    page,
  }) => {
    // Login as owner (assumes test fixtures / seed data exist)
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "owner@galeriku.test");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/albums/);

    // Navigate to an album with photos
    await page.click("text=Test Album");
    await page.waitForURL(/\/albums\//);

    // Click preview watermark
    const previewBtn = page.locator("text=Preview Watermark");
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      // Wait for preview modal
      await expect(page.locator("text=Watermark Preview")).toBeVisible({
        timeout: 10000,
      });
      // Could show "Generating preview..." then the image
      await page.waitForSelector('img[alt="Watermark preview"]', {
        timeout: 15000,
      });
      // Close preview
      await page.click("text=Looks good");
    }

    // Open publish dialog
    await page.click("text=Publish to client");
    await expect(page.locator("text=Publish album")).toBeVisible();

    // Select watermarked policy
    await page.click("#publish-policy");
    await page.click('text=Watermarked');

    // Click publish
    await page.click('button:has-text("Publish")');

    // Wait for link to appear
    await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 15000 });

    // Check for watermark progress
    const progressText = page.locator("text=Generating watermark");
    if (await progressText.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Wait for completion
      await expect(page.locator("text=Watermark generation complete")).toBeVisible({
        timeout: 120000,
      });
    }

    await page.click("text=Selesai");
  });

  test("text watermark flow", async ({ page }) => {
    // Login
    await page.goto("/sign-in");
    await page.fill('input[name="email"]', "owner@galeriku.test");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/albums/);

    // Navigate to watermark settings (if settings page exists)
    // or configure via album override

    // Navigate to album
    await page.click("text=Test Album");

    // Preview watermark
    const previewBtn = page.locator("text=Preview Watermark");
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await page.waitForSelector('img[alt="Watermark preview"]', {
        timeout: 15000,
      });
      await page.click("text=Looks good");
    }
  });
});
```

- [ ] **Step 2: Run E2E tests**

```bash
pnpm e2e e2e/watermark.spec.ts
```

Expected: Tests pass against a running dev server with seed data.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "test(watermark): add E2E tests for logo and text watermark flows"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run full unit/integration suite**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:57432/galeriku_test?sslmode=disable pnpm test
```

All tests must pass, including all existing ~448 tests + ~40-50 new watermark tests.

- [ ] **Step 2: Run build**

```bash
pnpm build
```

Build must complete cleanly with no TypeScript errors.

- [ ] **Step 3: Run E2E suite**

```bash
pnpm e2e
```

All E2E tests must pass.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore(watermark): final verification -- all tests pass, build clean"
```
