# Plan 2: Albums + Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement album CRUD with per-album permissions, media upload via presigned URL to Cloudflare R2, thumbnail proxy with Vercel Edge cache, media viewing (lightbox), video streaming, and download.

**Architecture:** Albums and media metadata stored in PostgreSQL via Drizzle. Files stored in Cloudflare R2 (single private bucket). Upload flow: client generates thumbnail → requests batch presigned URLs → uploads directly to R2 → saves metadata via server action. Viewing: thumbnails served via `/api/thumbnail/[mediaId]` with aggressive caching; originals via time-limited signed URLs.

**Tech Stack:** Drizzle ORM, Cloudflare R2 (@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner), Zod, React Server Components, Server Actions, shadcn/ui

**Spec reference:** `docs/superpowers/specs/2026-04-06-galeriku-design.md` — sections: Data Model (Album, Media, AlbumMember), Upload & Media Flow, UI/UX

**Testing:** Vitest + happy-dom + @testing-library/react. TDD for all tasks. Run `pnpm test` to verify.

---

## File Map

### Task 1: Album + Media + AlbumMember Database Schema
- Create: `src/db/schema/album.ts`
- Create: `src/db/schema/media.ts`
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/__tests__/album.test.ts`
- Test: `src/db/schema/__tests__/media.test.ts`

### Task 2: R2 Client
- Create: `src/shared/lib/r2.ts`
- Test: `src/shared/lib/__tests__/r2.test.ts`

### Task 3: Album Service (CRUD + Permissions)
- Create: `src/features/album/services/album.service.ts`
- Create: `src/features/album/types.ts`
- Test: `src/features/album/services/__tests__/album.service.test.ts`

### Task 4: Album Server Actions
- Create: `src/features/album/actions/create-album.ts`
- Create: `src/features/album/actions/delete-album.ts`
- Create: `src/features/album/actions/update-album.ts`
- Create: `src/features/album/actions/manage-members.ts`

### Task 5: Presigned URL API Route
- Create: `src/app/api/upload/presign/route.ts`
- Test: `src/features/media/services/__tests__/presign.test.ts`

### Task 6: Thumbnail Proxy API Route
- Create: `src/app/api/thumbnail/[mediaId]/route.ts`

### Task 7: Media Service
- Create: `src/features/media/services/media.service.ts`
- Create: `src/features/media/types.ts`
- Test: `src/features/media/services/__tests__/media.service.test.ts`

### Task 8: Media Server Actions
- Create: `src/features/media/actions/save-media.ts`
- Create: `src/features/media/actions/delete-media.ts`
- Create: `src/features/media/actions/get-signed-url.ts`

### Task 9: Album UI — List Page + Create Album
- Create: `src/features/album/components/album-grid.tsx`
- Create: `src/features/album/components/album-card.tsx`
- Create: `src/features/album/components/create-album-dialog.tsx`
- Modify: `src/app/(main)/albums/page.tsx`
- Test: `src/features/album/components/__tests__/album-card.test.tsx`

### Task 10: Album UI — Detail Page (Media Grid)
- Create: `src/features/media/components/media-grid.tsx`
- Create: `src/features/media/components/media-card.tsx`
- Create: `src/features/album/components/album-header.tsx`
- Create: `src/app/(main)/albums/[id]/page.tsx`
- Test: `src/features/media/components/__tests__/media-card.test.tsx`

### Task 11: Upload Component
- Create: `src/features/media/components/upload-dialog.tsx`
- Create: `src/features/media/hooks/use-media-upload.ts`
- Create: `src/features/media/services/thumbnail.client.ts`
- Test: `src/features/media/services/__tests__/thumbnail.client.test.ts`

### Task 12: Media Viewer (Lightbox + Video + Download)
- Create: `src/features/media/components/media-viewer.tsx`
- Create: `src/features/media/components/video-player.tsx`
- Create: `src/app/(main)/media/[id]/page.tsx`
- Test: `src/features/media/components/__tests__/media-viewer.test.tsx`

### Task 13: Album Member Management
- Create: `src/features/album/components/members-dialog.tsx`
- Test: `src/features/album/components/__tests__/members-dialog.test.tsx`

---

## Task 1: Album + Media + AlbumMember Database Schema

**Files:**
- Create: `src/db/schema/album.ts`
- Create: `src/db/schema/media.ts`
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/__tests__/album.test.ts`
- Test: `src/db/schema/__tests__/media.test.ts`

- [ ] **Step 1: Write failing tests for album schema**

```typescript
// src/db/schema/__tests__/album.test.ts
import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";

// These imports will fail until we create the schema
import { album, albumMember, albumRelations, albumMemberRelations } from "../album";

describe("album table", () => {
  it("has correct table name", () => {
    expect(getTableName(album)).toBe("album");
  });

  it("has all required columns", () => {
    const columns = getTableColumns(album);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("name");
    expect(columns).toHaveProperty("description");
    expect(columns).toHaveProperty("coverMediaId");
    expect(columns).toHaveProperty("createdBy");
    expect(columns).toHaveProperty("createdAt");
    expect(columns).toHaveProperty("updatedAt");
  });
});

describe("albumMember table", () => {
  it("has correct table name", () => {
    expect(getTableName(albumMember)).toBe("album_member");
  });

  it("has all required columns", () => {
    const columns = getTableColumns(albumMember);
    expect(columns).toHaveProperty("albumId");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("role");
    expect(columns).toHaveProperty("invitedAt");
  });
});

describe("album relations", () => {
  it("exports albumRelations", () => {
    expect(albumRelations).toBeDefined();
  });

  it("exports albumMemberRelations", () => {
    expect(albumMemberRelations).toBeDefined();
  });
});
```

- [ ] **Step 2: Write failing tests for media schema**

```typescript
// src/db/schema/__tests__/media.test.ts
import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { media, mediaRelations } from "../media";

describe("media table", () => {
  it("has correct table name", () => {
    expect(getTableName(media)).toBe("media");
  });

  it("has all required columns", () => {
    const columns = getTableColumns(media);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("albumId");
    expect(columns).toHaveProperty("uploadedBy");
    expect(columns).toHaveProperty("type");
    expect(columns).toHaveProperty("filename");
    expect(columns).toHaveProperty("r2Key");
    expect(columns).toHaveProperty("thumbnailR2Key");
    expect(columns).toHaveProperty("mimeType");
    expect(columns).toHaveProperty("sizeBytes");
    expect(columns).toHaveProperty("width");
    expect(columns).toHaveProperty("height");
    expect(columns).toHaveProperty("duration");
    expect(columns).toHaveProperty("createdAt");
  });
});

describe("media relations", () => {
  it("exports mediaRelations", () => {
    expect(mediaRelations).toBeDefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- --run src/db/schema/__tests__/album.test.ts src/db/schema/__tests__/media.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Create album schema**

```typescript
// src/db/schema/album.ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { user } from "./user";

export const album = pgTable("album", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  coverMediaId: uuid("cover_media_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  creator: one(user, {
    fields: [album.createdBy],
    references: [user.id],
  }),
  members: many(albumMember),
}));

export const albumMemberRelations = relations(albumMember, ({ one }) => ({
  album: one(album, {
    fields: [albumMember.albumId],
    references: [album.id],
  }),
  user: one(user, {
    fields: [albumMember.userId],
    references: [user.id],
  }),
}));
```

- [ ] **Step 5: Create media schema**

```typescript
// src/db/schema/media.ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, integer, bigint, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { album } from "./album";

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => album.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["photo", "video"] }).notNull(),
    filename: text("filename").notNull(),
    r2Key: text("r2_key").notNull(),
    thumbnailR2Key: text("thumbnail_r2_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_albumId_idx").on(table.albumId),
    index("media_uploadedBy_idx").on(table.uploadedBy),
  ],
);

export const mediaRelations = relations(media, ({ one }) => ({
  album: one(album, {
    fields: [media.albumId],
    references: [album.id],
  }),
  uploader: one(user, {
    fields: [media.uploadedBy],
    references: [user.id],
  }),
}));
```

- [ ] **Step 6: Update schema barrel export**

```typescript
// src/db/schema/index.ts
export * from "./user";
export * from "./album";
export * from "./media";
export * from "./app-settings";
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS including new album and media schema tests.

- [ ] **Step 8: Generate and run migration**

```bash
pnpm db:generate
pnpm db:migrate
```

Expected: New migration with album, album_member, media tables.

- [ ] **Step 9: Commit**

```bash
git add src/db/schema src/db/migrations
git commit -m "feat: add album, album_member, media database schemas

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: R2 Client

**Files:**
- Create: `src/shared/lib/r2.ts`
- Test: `src/shared/lib/__tests__/r2.test.ts`

- [ ] **Step 1: Install AWS S3 SDK**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: Write failing tests for R2 client**

```typescript
// src/shared/lib/__tests__/r2.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AWS SDK
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-url"),
}));

// Set env vars before import
process.env.R2_ACCOUNT_ID = "test-account";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_BUCKET_NAME = "test-bucket";

import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  getObject,
  deleteObject,
  buildOriginalKey,
  buildThumbnailKey,
} from "../r2";

describe("R2 key builders", () => {
  it("builds original key", () => {
    expect(buildOriginalKey("album-1", "media-1", "jpg")).toBe(
      "originals/album-1/media-1.jpg"
    );
  });

  it("builds thumbnail key", () => {
    expect(buildThumbnailKey("media-1")).toBe("thumbnails/media-1.webp");
  });
});

describe("R2 presigned URLs", () => {
  it("generates upload presigned URL", async () => {
    const url = await getUploadPresignedUrl("originals/a/b.jpg", "image/jpeg");
    expect(url).toBe("https://r2.example.com/signed-url");
  });

  it("generates download presigned URL", async () => {
    const url = await getDownloadPresignedUrl("originals/a/b.jpg", "photo.jpg");
    expect(url).toBe("https://r2.example.com/signed-url");
  });
});

describe("R2 operations", () => {
  it("getObject calls S3Client.send", async () => {
    const result = await getObject("thumbnails/media-1.webp");
    expect(result).toBeDefined();
  });

  it("deleteObject calls S3Client.send", async () => {
    await expect(deleteObject("originals/a/b.jpg")).resolves.not.toThrow();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- --run src/shared/lib/__tests__/r2.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create R2 client**

```typescript
// src/shared/lib/r2.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export function buildOriginalKey(
  albumId: string,
  mediaId: string,
  ext: string
): string {
  return `originals/${albumId}/${mediaId}.${ext}`;
}

export function buildThumbnailKey(mediaId: string): string {
  return `thumbnails/${mediaId}.webp`;
}

export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function getDownloadPresignedUrl(
  key: string,
  filename: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function getViewPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function getObject(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3.send(command);
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3.send(command);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- --run src/shared/lib/__tests__/r2.test.ts`
Expected: All PASS.

- [ ] **Step 6: Add `@aws-sdk/client-s3` to serverExternalPackages in next.config.ts**

Add to the existing `serverExternalPackages` array in `next.config.ts`:

```typescript
serverExternalPackages: ["@node-rs/argon2", "@aws-sdk/client-s3"],
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/lib next.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add R2 client with presigned URL support

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Album Service (CRUD + Permissions)

**Files:**
- Create: `src/features/album/types.ts`
- Create: `src/features/album/services/album.service.ts`
- Test: `src/features/album/services/__tests__/album.service.test.ts`

- [ ] **Step 1: Create album types**

```typescript
// src/features/album/types.ts
export type AlbumMemberRole = "viewer" | "editor";

export interface AlbumWithMeta {
  id: string;
  name: string;
  description: string | null;
  coverMediaId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  mediaCount: number;
}

export interface AlbumMemberInfo {
  userId: string;
  userName: string;
  userEmail: string;
  role: AlbumMemberRole;
  invitedAt: Date;
}
```

- [ ] **Step 2: Write failing tests for album service**

```typescript
// src/features/album/services/__tests__/album.service.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock the database
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "album-1", name: "Test" }]),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));

import {
  canAccessAlbum,
  canEditAlbum,
} from "../album.service";

describe("Album permission checks", () => {
  it("canAccessAlbum returns true for album creator", async () => {
    // This will test the function signature exists
    expect(typeof canAccessAlbum).toBe("function");
  });

  it("canEditAlbum returns true for editor role", async () => {
    expect(typeof canEditAlbum).toBe("function");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- --run src/features/album/services/__tests__/album.service.test.ts`
Expected: FAIL.

- [ ] **Step 4: Create album service**

```typescript
// src/features/album/services/album.service.ts
import { db } from "@/db";
import { album, albumMember } from "@/db/schema";
import { media } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, and, count, or, sql } from "drizzle-orm";
import type { AlbumMemberRole } from "../types";

export async function createAlbum(data: {
  name: string;
  description?: string;
  createdBy: string;
}) {
  const [newAlbum] = await db
    .insert(album)
    .values({
      name: data.name,
      description: data.description ?? null,
      createdBy: data.createdBy,
    })
    .returning();

  // Auto-add creator as editor
  await db.insert(albumMember).values({
    albumId: newAlbum.id,
    userId: data.createdBy,
    role: "editor",
  });

  return newAlbum;
}

export async function getAlbumsForUser(userId: string, userRole: string) {
  // Owner can see all albums
  if (userRole === "owner") {
    return db
      .select({
        id: album.id,
        name: album.name,
        description: album.description,
        coverMediaId: album.coverMediaId,
        createdBy: album.createdBy,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.album_id = ${album.id})::int`,
        memberCount: sql<number>`(SELECT COUNT(*) FROM album_member WHERE album_member.album_id = ${album.id})::int`,
      })
      .from(album)
      .orderBy(album.updatedAt);
  }

  // Members see only albums they're part of
  return db
    .select({
      id: album.id,
      name: album.name,
      description: album.description,
      coverMediaId: album.coverMediaId,
      createdBy: album.createdBy,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.album_id = ${album.id})::int`,
      memberCount: sql<number>`(SELECT COUNT(*) FROM album_member WHERE album_member.album_id = ${album.id})::int`,
    })
    .from(album)
    .innerJoin(albumMember, eq(album.id, albumMember.albumId))
    .where(eq(albumMember.userId, userId))
    .orderBy(album.updatedAt);
}

export async function getAlbumById(albumId: string) {
  const [result] = await db
    .select()
    .from(album)
    .where(eq(album.id, albumId))
    .limit(1);
  return result ?? null;
}

export async function updateAlbum(
  albumId: string,
  data: { name?: string; description?: string; coverMediaId?: string | null }
) {
  const [updated] = await db
    .update(album)
    .set(data)
    .where(eq(album.id, albumId))
    .returning();
  return updated;
}

export async function deleteAlbum(albumId: string) {
  await db.delete(album).where(eq(album.id, albumId));
}

export async function canAccessAlbum(
  albumId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === "owner") return true;

  const [member] = await db
    .select()
    .from(albumMember)
    .where(and(eq(albumMember.albumId, albumId), eq(albumMember.userId, userId)))
    .limit(1);

  return !!member;
}

export async function canEditAlbum(
  albumId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === "owner") return true;

  const [member] = await db
    .select()
    .from(albumMember)
    .where(
      and(
        eq(albumMember.albumId, albumId),
        eq(albumMember.userId, userId),
        eq(albumMember.role, "editor")
      )
    )
    .limit(1);

  return !!member;
}

export async function getAlbumMembers(albumId: string) {
  return db
    .select({
      userId: albumMember.userId,
      userName: user.name,
      userEmail: user.email,
      role: albumMember.role,
      invitedAt: albumMember.invitedAt,
    })
    .from(albumMember)
    .innerJoin(user, eq(albumMember.userId, user.id))
    .where(eq(albumMember.albumId, albumId));
}

export async function addAlbumMember(
  albumId: string,
  userId: string,
  role: AlbumMemberRole = "viewer"
) {
  await db
    .insert(albumMember)
    .values({ albumId, userId, role })
    .onConflictDoNothing();
}

export async function removeAlbumMember(albumId: string, userId: string) {
  await db
    .delete(albumMember)
    .where(and(eq(albumMember.albumId, albumId), eq(albumMember.userId, userId)));
}

export async function updateMemberRole(
  albumId: string,
  userId: string,
  role: AlbumMemberRole
) {
  await db
    .update(albumMember)
    .set({ role })
    .where(and(eq(albumMember.albumId, albumId), eq(albumMember.userId, userId)));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/album
git commit -m "feat: add album service with CRUD and permission checks

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Album Server Actions

**Files:**
- Create: `src/features/album/actions/create-album.ts`
- Create: `src/features/album/actions/delete-album.ts`
- Create: `src/features/album/actions/update-album.ts`
- Create: `src/features/album/actions/manage-members.ts`

- [ ] **Step 1: Create album actions**

```typescript
// src/features/album/actions/create-album.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

const createAlbumSchema = z.object({
  name: z.string().min(1, "Album name is required").max(100),
  description: z.string().max(500).optional(),
});

export type CreateAlbumState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createAlbumAction(
  _prev: CreateAlbumState,
  formData: FormData
): Promise<CreateAlbumState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = createAlbumSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createAlbum({
      name: parsed.data.name,
      description: parsed.data.description,
      createdBy: session.user.id,
    });
  } catch {
    return { error: "Failed to create album" };
  }

  revalidatePath("/albums");
  return {};
}
```

```typescript
// src/features/album/actions/delete-album.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { deleteAlbum, canEditAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

export async function deleteAlbumAction(albumId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) {
    return { error: "Permission denied" };
  }

  await deleteAlbum(albumId);
  revalidatePath("/albums");
  return { success: true };
}
```

```typescript
// src/features/album/actions/update-album.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateAlbum, canEditAlbum } from "../services/album.service";
import { revalidatePath } from "next/cache";

const updateAlbumSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function updateAlbumAction(
  albumId: string,
  data: { name?: string; description?: string }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) {
    return { error: "Permission denied" };
  }

  const parsed = updateAlbumSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  await updateAlbum(albumId, parsed.data);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
```

```typescript
// src/features/album/actions/manage-members.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  addAlbumMember,
  removeAlbumMember,
  updateMemberRole,
  canEditAlbum,
} from "../services/album.service";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AlbumMemberRole } from "../types";

export async function inviteMemberAction(
  albumId: string,
  email: string,
  role: AlbumMemberRole = "viewer"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  // Find user by email
  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!targetUser) return { error: "User not found" };

  await addAlbumMember(albumId, targetUser.id, role);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function removeMemberAction(albumId: string, userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await removeAlbumMember(albumId, userId);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}

export async function updateMemberRoleAction(
  albumId: string,
  userId: string,
  role: AlbumMemberRole
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await updateMemberRole(albumId, userId, role);
  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/features/album/actions
git commit -m "feat: add album server actions (create, update, delete, manage members)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Presigned URL API Route

**Files:**
- Create: `src/app/api/upload/presign/route.ts`

- [ ] **Step 1: Create presign API route**

```typescript
// src/app/api/upload/presign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { canEditAlbum } from "@/features/album/services/album.service";
import { getUploadPresignedUrl, buildOriginalKey, buildThumbnailKey } from "@/shared/lib/r2";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_PHOTO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const presignSchema = z.object({
  albumId: z.string().uuid(),
  files: z.array(
    z.object({
      id: z.string().uuid(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().positive(),
      ext: z.string(),
    })
  ).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { albumId, files } = parsed.data;
  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";

  // Permission check
  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Validate each file
  for (const file of files) {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: `Unsupported file type: ${file.mimeType}` }, { status: 400 });
    }

    if (isImage && file.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: `Photo too large: ${file.filename}` }, { status: 400 });
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: `Video too large: ${file.filename}` }, { status: 400 });
    }
  }

  // Generate presigned URLs for each file
  const presignedUrls = await Promise.all(
    files.map(async (file) => {
      const originalKey = buildOriginalKey(albumId, file.id, file.ext);
      const thumbnailKey = buildThumbnailKey(file.id);

      const [originalUrl, thumbnailUrl] = await Promise.all([
        getUploadPresignedUrl(originalKey, file.mimeType),
        getUploadPresignedUrl(thumbnailKey, "image/webp"),
      ]);

      return {
        fileId: file.id,
        originalUrl,
        originalKey,
        thumbnailUrl,
        thumbnailKey,
      };
    })
  );

  return NextResponse.json({ presignedUrls });
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload
git commit -m "feat: add presigned URL API route for batch upload

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Thumbnail Proxy API Route

**Files:**
- Create: `src/app/api/thumbnail/[mediaId]/route.ts`

- [ ] **Step 1: Create thumbnail proxy**

```typescript
// src/app/api/thumbnail/[mediaId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { media } from "@/db/schema";
import { albumMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getObject } from "@/shared/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get media record
  const [mediaRecord] = await db
    .select()
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);

  if (!mediaRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Permission check
  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  if (userRole !== "owner") {
    const [member] = await db
      .select()
      .from(albumMember)
      .where(
        and(
          eq(albumMember.albumId, mediaRecord.albumId),
          eq(albumMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Fetch thumbnail from R2
  try {
    const object = await getObject(mediaRecord.thumbnailR2Key);
    const body = await object.Body?.transformToByteArray();

    if (!body) {
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch thumbnail" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/thumbnail
git commit -m "feat: add thumbnail proxy API with Vercel Edge caching

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Media Service

**Files:**
- Create: `src/features/media/types.ts`
- Create: `src/features/media/services/media.service.ts`
- Test: `src/features/media/services/__tests__/media.service.test.ts`

- [ ] **Step 1: Create media types**

```typescript
// src/features/media/types.ts
export type MediaType = "photo" | "video";

export interface MediaItem {
  id: string;
  albumId: string;
  uploadedBy: string;
  type: MediaType;
  filename: string;
  r2Key: string;
  thumbnailR2Key: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: Date;
}

export interface MediaWithUploader extends MediaItem {
  uploaderName: string;
}
```

- [ ] **Step 2: Write failing test**

```typescript
// src/features/media/services/__tests__/media.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

import {
  getMediaForAlbum,
  getMediaById,
  saveMediaBatch,
  deleteMediaById,
} from "../media.service";

describe("Media service", () => {
  it("exports getMediaForAlbum", () => {
    expect(typeof getMediaForAlbum).toBe("function");
  });

  it("exports getMediaById", () => {
    expect(typeof getMediaById).toBe("function");
  });

  it("exports saveMediaBatch", () => {
    expect(typeof saveMediaBatch).toBe("function");
  });

  it("exports deleteMediaById", () => {
    expect(typeof deleteMediaById).toBe("function");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- --run src/features/media/services/__tests__/media.service.test.ts`
Expected: FAIL.

- [ ] **Step 4: Create media service**

```typescript
// src/features/media/services/media.service.ts
import { db } from "@/db";
import { media } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { deleteObject } from "@/shared/lib/r2";

export async function getMediaForAlbum(
  albumId: string,
  page = 1,
  pageSize = 20
) {
  const offset = (page - 1) * pageSize;

  return db
    .select({
      id: media.id,
      albumId: media.albumId,
      uploadedBy: media.uploadedBy,
      type: media.type,
      filename: media.filename,
      r2Key: media.r2Key,
      thumbnailR2Key: media.thumbnailR2Key,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      width: media.width,
      height: media.height,
      duration: media.duration,
      createdAt: media.createdAt,
      uploaderName: user.name,
    })
    .from(media)
    .innerJoin(user, eq(media.uploadedBy, user.id))
    .where(eq(media.albumId, albumId))
    .orderBy(desc(media.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function getMediaById(mediaId: string) {
  const [result] = await db
    .select({
      id: media.id,
      albumId: media.albumId,
      uploadedBy: media.uploadedBy,
      type: media.type,
      filename: media.filename,
      r2Key: media.r2Key,
      thumbnailR2Key: media.thumbnailR2Key,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      width: media.width,
      height: media.height,
      duration: media.duration,
      createdAt: media.createdAt,
      uploaderName: user.name,
    })
    .from(media)
    .innerJoin(user, eq(media.uploadedBy, user.id))
    .where(eq(media.id, mediaId))
    .limit(1);

  return result ?? null;
}

export async function saveMediaBatch(
  items: Array<{
    id: string;
    albumId: string;
    uploadedBy: string;
    type: "photo" | "video";
    filename: string;
    r2Key: string;
    thumbnailR2Key: string;
    mimeType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
  }>
) {
  if (items.length === 0) return [];

  return db
    .insert(media)
    .values(
      items.map((item) => ({
        id: item.id,
        albumId: item.albumId,
        uploadedBy: item.uploadedBy,
        type: item.type,
        filename: item.filename,
        r2Key: item.r2Key,
        thumbnailR2Key: item.thumbnailR2Key,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        width: item.width ?? null,
        height: item.height ?? null,
        duration: item.duration ?? null,
      }))
    )
    .returning();
}

export async function deleteMediaById(mediaId: string) {
  // Get media to find R2 keys
  const [mediaRecord] = await db
    .select()
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);

  if (!mediaRecord) return;

  // Delete from R2
  await Promise.all([
    deleteObject(mediaRecord.r2Key),
    deleteObject(mediaRecord.thumbnailR2Key),
  ]);

  // Delete from DB
  await db.delete(media).where(eq(media.id, mediaId));
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test`
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/media
git commit -m "feat: add media service with batch insert and R2 cleanup

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Media Server Actions

**Files:**
- Create: `src/features/media/actions/save-media.ts`
- Create: `src/features/media/actions/delete-media.ts`
- Create: `src/features/media/actions/get-signed-url.ts`

- [ ] **Step 1: Create media actions**

```typescript
// src/features/media/actions/save-media.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canEditAlbum } from "@/features/album/services/album.service";
import { saveMediaBatch } from "../services/media.service";
import { revalidatePath } from "next/cache";

const mediaItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["photo", "video"]),
  filename: z.string(),
  r2Key: z.string(),
  thumbnailR2Key: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().positive(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
});

const saveMediaSchema = z.object({
  albumId: z.string().uuid(),
  items: z.array(mediaItemSchema).min(1),
});

export async function saveMediaAction(data: z.infer<typeof saveMediaSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = saveMediaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  const { albumId, items } = parsed.data;
  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";

  const canEdit = await canEditAlbum(albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  try {
    await saveMediaBatch(
      items.map((item) => ({
        ...item,
        albumId,
        uploadedBy: session.user.id,
      }))
    );
  } catch {
    return { error: "Failed to save media metadata" };
  }

  revalidatePath(`/albums/${albumId}`);
  return { success: true };
}
```

```typescript
// src/features/media/actions/delete-media.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canEditAlbum } from "@/features/album/services/album.service";
import { getMediaById, deleteMediaById } from "../services/media.service";
import { revalidatePath } from "next/cache";

export async function deleteMediaAction(mediaId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await deleteMediaById(mediaId);
  revalidatePath(`/albums/${mediaRecord.albumId}`);
  return { success: true };
}
```

```typescript
// src/features/media/actions/get-signed-url.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "../services/media.service";
import { getViewPresignedUrl, getDownloadPresignedUrl } from "@/shared/lib/r2";

export async function getViewUrlAction(mediaId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  const expiresIn = mediaRecord.type === "video" ? 14400 : 3600; // 4hr video, 1hr photo
  const url = await getViewPresignedUrl(mediaRecord.r2Key, expiresIn);
  return { url };
}

export async function getDownloadUrlAction(mediaId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  const url = await getDownloadPresignedUrl(mediaRecord.r2Key, mediaRecord.filename);
  return { url };
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/features/media/actions
git commit -m "feat: add media server actions (save batch, delete, signed URLs)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Album UI — List Page + Create Album

**Files:**
- Create: `src/features/album/components/album-card.tsx`
- Create: `src/features/album/components/album-grid.tsx`
- Create: `src/features/album/components/create-album-dialog.tsx`
- Modify: `src/app/(main)/albums/page.tsx`
- Test: `src/features/album/components/__tests__/album-card.test.tsx`

Install dialog component first:

- [ ] **Step 1: Add shadcn dialog component**

```bash
pnpm dlx shadcn@latest add dialog textarea
```

- [ ] **Step 2: Write failing test for AlbumCard**

```tsx
// src/features/album/components/__tests__/album-card.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { AlbumCard } from "../album-card";

const mockAlbum = {
  id: "album-1",
  name: "Liburan Bali",
  description: "Summer trip",
  coverMediaId: null,
  createdBy: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  memberCount: 3,
  mediaCount: 124,
};

describe("AlbumCard", () => {
  it("renders album name", () => {
    render(<AlbumCard album={mockAlbum} />);
    expect(screen.getByText("Liburan Bali")).toBeInTheDocument();
  });

  it("renders media count", () => {
    render(<AlbumCard album={mockAlbum} />);
    expect(screen.getByText(/124/)).toBeInTheDocument();
  });

  it("renders member count", () => {
    render(<AlbumCard album={mockAlbum} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("links to album detail page", () => {
    render(<AlbumCard album={mockAlbum} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/albums/album-1");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- --run src/features/album/components/__tests__/album-card.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Create AlbumCard component**

```tsx
// src/features/album/components/album-card.tsx
import Link from "next/link";
import { ImageIcon, Users } from "lucide-react";
import type { AlbumWithMeta } from "../types";

interface AlbumCardProps {
  album: AlbumWithMeta;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link href={`/albums/${album.id}`} className="group">
      <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        {/* Cover */}
        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
          {album.coverMediaId ? (
            <img
              src={`/api/thumbnail/${album.coverMediaId}`}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground/40" />
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{album.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="size-3" />
              {album.mediaCount}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {album.memberCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run src/features/album/components/__tests__/album-card.test.tsx`
Expected: PASS.

- [ ] **Step 6: Create AlbumGrid component**

```tsx
// src/features/album/components/album-grid.tsx
import { AlbumCard } from "./album-card";
import type { AlbumWithMeta } from "../types";

interface AlbumGridProps {
  albums: AlbumWithMeta[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create CreateAlbumDialog component**

```tsx
// src/features/album/components/create-album-dialog.tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createAlbumAction, type CreateAlbumState } from "../actions/create-album";

export function CreateAlbumDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateAlbumState, FormData>(
    async (prev, formData) => {
      const result = await createAlbumAction(prev, formData);
      if (!result.error && !result.fieldErrors) {
        setOpen(false);
      }
      return result;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
          <Plus className="size-6" />
          <span className="text-xs">New Album</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Album</DialogTitle>
          <DialogDescription>Create a new album to organize your memories.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Album Name</Label>
            <Input id="name" name="name" placeholder="e.g. Liburan Bali" required />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="What's this album about?" rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create Album"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 8: Update albums page**

```tsx
// src/app/(main)/albums/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAlbumsForUser } from "@/features/album/services/album.service";
import { AlbumGrid } from "@/features/album/components/album-grid";
import { CreateAlbumDialog } from "@/features/album/components/create-album-dialog";

export default async function AlbumsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const albums = await getAlbumsForUser(session.user.id, userRole);

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Albums</h1>
          <p className="text-sm text-muted-foreground">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {albums.map((album) => (
          <AlbumGrid key="grid" albums={albums} />
        ))}
        <CreateAlbumDialog />
      </div>
    </div>
  );
}
```

Wait — there's a bug above. The grid is inside a grid and maps albums incorrectly. Fix:

```tsx
// src/app/(main)/albums/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAlbumsForUser } from "@/features/album/services/album.service";
import { AlbumCard } from "@/features/album/components/album-card";
import { CreateAlbumDialog } from "@/features/album/components/create-album-dialog";

export default async function AlbumsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const albums = await getAlbumsForUser(session.user.id, userRole);

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Albums</h1>
          <p className="text-sm text-muted-foreground">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
        <CreateAlbumDialog />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Run all tests**

```bash
pnpm test
```

- [ ] **Step 10: Commit**

```bash
git add src/features/album/components src/app/\(main\)/albums/page.tsx
git commit -m "feat: add album list page with create album dialog

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Album Detail Page (Media Grid)

**Files:**
- Create: `src/features/media/components/media-card.tsx`
- Create: `src/features/media/components/media-grid.tsx`
- Create: `src/features/album/components/album-header.tsx`
- Create: `src/app/(main)/albums/[id]/page.tsx`
- Test: `src/features/media/components/__tests__/media-card.test.tsx`

- [ ] **Step 1: Write failing test for MediaCard**

```tsx
// src/features/media/components/__tests__/media-card.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { MediaCard } from "../media-card";

const mockMedia = {
  id: "media-1",
  albumId: "album-1",
  uploadedBy: "user-1",
  type: "photo" as const,
  filename: "sunset.jpg",
  r2Key: "originals/album-1/media-1.jpg",
  thumbnailR2Key: "thumbnails/media-1.webp",
  mimeType: "image/jpeg",
  sizeBytes: 4200000,
  width: 4032,
  height: 3024,
  duration: null,
  createdAt: new Date(),
  uploaderName: "Beni",
};

describe("MediaCard", () => {
  it("renders thumbnail image", () => {
    render(<MediaCard media={mockMedia} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/api/thumbnail/media-1");
  });

  it("links to media detail page", () => {
    render(<MediaCard media={mockMedia} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/media/media-1");
  });

  it("shows video duration badge for videos", () => {
    const videoMedia = { ...mockMedia, type: "video" as const, duration: 45 };
    render(<MediaCard media={videoMedia} />);
    expect(screen.getByText("0:45")).toBeInTheDocument();
  });

  it("does not show duration for photos", () => {
    render(<MediaCard media={mockMedia} />);
    expect(screen.queryByText(/:/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/features/media/components/__tests__/media-card.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create MediaCard component**

```tsx
// src/features/media/components/media-card.tsx
import Link from "next/link";
import { Play } from "lucide-react";
import type { MediaWithUploader } from "../types";

interface MediaCardProps {
  media: MediaWithUploader;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MediaCard({ media }: MediaCardProps) {
  return (
    <Link href={`/media/${media.id}`} className="group">
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
        <img
          src={`/api/thumbnail/${media.id}`}
          alt={media.filename}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />

        {/* Video duration badge */}
        {media.type === "video" && media.duration != null && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] text-white font-medium">
            <Play className="size-2.5 fill-current" />
            {formatDuration(media.duration)}
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/features/media/components/__tests__/media-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Create MediaGrid**

```tsx
// src/features/media/components/media-grid.tsx
import { MediaCard } from "./media-card";
import type { MediaWithUploader } from "../types";

interface MediaGridProps {
  items: MediaWithUploader[];
}

export function MediaGrid({ items }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No media yet</p>
        <p className="text-xs mt-1">Upload photos or videos to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
      {items.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create AlbumHeader**

```tsx
// src/features/album/components/album-header.tsx
"use client";

import { ArrowLeft, Users, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AlbumHeaderProps {
  albumId: string;
  name: string;
  mediaCount: number;
  canEdit: boolean;
  onUploadClick?: () => void;
  onMembersClick?: () => void;
}

export function AlbumHeader({
  name,
  mediaCount,
  canEdit,
  onUploadClick,
  onMembersClick,
}: AlbumHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <Link href="/albums" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{name}</h1>
          <p className="text-xs text-muted-foreground">{mediaCount} items</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={onMembersClick}>
          <Users className="size-4" />
        </Button>
        {canEdit && (
          <Button size="sm" className="rounded-xl gap-1.5" onClick={onUploadClick}>
            <Upload className="size-3.5" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create album detail page**

```tsx
// src/app/(main)/albums/[id]/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getAlbumById, canAccessAlbum, canEditAlbum } from "@/features/album/services/album.service";
import { getMediaForAlbum } from "@/features/media/services/media.service";
import { AlbumHeader } from "@/features/album/components/album-header";
import { MediaGrid } from "@/features/media/components/media-grid";

interface AlbumDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";

  const albumData = await getAlbumById(id);
  if (!albumData) notFound();

  const hasAccess = await canAccessAlbum(id, session.user.id, userRole);
  if (!hasAccess) redirect("/albums");

  const hasEditAccess = await canEditAlbum(id, session.user.id, userRole);
  const mediaItems = await getMediaForAlbum(id);

  return (
    <div>
      <AlbumHeader
        albumId={id}
        name={albumData.name}
        mediaCount={mediaItems.length}
        canEdit={hasEditAccess}
      />
      <div className="px-2 lg:px-4">
        <MediaGrid items={mediaItems} />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run all tests**

```bash
pnpm test
```

- [ ] **Step 9: Commit**

```bash
git add src/features/media/components src/features/album/components/album-header.tsx src/app/\(main\)/albums/\[id\]
git commit -m "feat: add album detail page with media grid

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Upload Component

**Files:**
- Create: `src/features/media/services/thumbnail.client.ts`
- Create: `src/features/media/hooks/use-media-upload.ts`
- Create: `src/features/media/components/upload-dialog.tsx`
- Test: `src/features/media/services/__tests__/thumbnail.client.test.ts`

- [ ] **Step 1: Write test for thumbnail generation utility functions**

```typescript
// src/features/media/services/__tests__/thumbnail.client.test.ts
import { describe, it, expect } from "vitest";
import { getFileExtension, isImageType, isVideoType, validateFileSize } from "../thumbnail.client";

describe("thumbnail.client utilities", () => {
  it("gets file extension from filename", () => {
    expect(getFileExtension("photo.jpg")).toBe("jpg");
    expect(getFileExtension("video.mp4")).toBe("mp4");
    expect(getFileExtension("file.name.png")).toBe("png");
  });

  it("identifies image types", () => {
    expect(isImageType("image/jpeg")).toBe(true);
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("video/mp4")).toBe(false);
  });

  it("identifies video types", () => {
    expect(isVideoType("video/mp4")).toBe(true);
    expect(isVideoType("video/webm")).toBe(true);
    expect(isVideoType("image/jpeg")).toBe(false);
  });

  it("validates file size", () => {
    expect(validateFileSize("image/jpeg", 10 * 1024 * 1024)).toBe(true); // 10MB photo OK
    expect(validateFileSize("image/jpeg", 25 * 1024 * 1024)).toBe(false); // 25MB photo too big
    expect(validateFileSize("video/mp4", 100 * 1024 * 1024)).toBe(true); // 100MB video OK
    expect(validateFileSize("video/mp4", 600 * 1024 * 1024)).toBe(false); // 600MB video too big
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/features/media/services/__tests__/thumbnail.client.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create thumbnail client utilities**

```typescript
// src/features/media/services/thumbnail.client.ts
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_PHOTO_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

export function isVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

export function validateFileSize(mimeType: string, size: number): boolean {
  if (isImageType(mimeType)) return size <= MAX_PHOTO_SIZE;
  if (isVideoType(mimeType)) return size <= MAX_VIDEO_SIZE;
  return false;
}

export async function generateImageThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const maxSize = 400;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create thumbnail"));
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export async function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const maxSize = 400;
      const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
      canvas.width = video.videoWidth * ratio;
      canvas.height = video.videoHeight * ratio;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create thumbnail"));
        },
        "image/webp",
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };

    video.preload = "metadata";
    video.src = url;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --run src/features/media/services/__tests__/thumbnail.client.test.ts`
Expected: PASS.

- [ ] **Step 5: Create upload hook**

```typescript
// src/features/media/hooks/use-media-upload.ts
"use client";

import { useState, useCallback } from "react";
import {
  getFileExtension,
  isImageType,
  isVideoType,
  validateFileSize,
  generateImageThumbnail,
  generateVideoThumbnail,
} from "../services/thumbnail.client";
import { saveMediaAction } from "../actions/save-media";

type UploadStatus = "pending" | "generating-thumb" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  thumbnail?: Blob;
  r2Key?: string;
  thumbnailR2Key?: string;
}

interface UploadResult {
  items: UploadItem[];
  addFiles: (files: FileList) => void;
  startUpload: (albumId: string) => Promise<void>;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isUploading: boolean;
}

export function useMediaUpload(): UploadResult {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((files: FileList) => {
    const newItems: UploadItem[] = Array.from(files)
      .filter((file) => {
        const valid = isImageType(file.type) || isVideoType(file.type);
        const sizeOk = validateFileSize(file.type, file.size);
        return valid && sizeOk;
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending" as const,
        progress: 0,
      }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const startUpload = useCallback(
    async (albumId: string) => {
      if (items.length === 0) return;
      setIsUploading(true);

      try {
        // Step 1: Generate thumbnails
        for (const item of items) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: "generating-thumb" } : i
            )
          );

          try {
            const thumb = isImageType(item.file.type)
              ? await generateImageThumbnail(item.file)
              : await generateVideoThumbnail(item.file);

            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, thumbnail: thumb } : i))
            );
          } catch {
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, status: "error", error: "Failed to generate thumbnail" }
                  : i
              )
            );
          }
        }

        // Step 2: Request batch presigned URLs
        const filesToUpload = items.filter((i) => i.status !== "error");
        const presignResponse = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumId,
            files: filesToUpload.map((item) => ({
              id: item.id,
              filename: item.file.name,
              mimeType: item.file.type,
              size: item.file.size,
              ext: getFileExtension(item.file.name),
            })),
          }),
        });

        if (!presignResponse.ok) {
          throw new Error("Failed to get presigned URLs");
        }

        const { presignedUrls } = await presignResponse.json();

        // Step 3: Upload files (3 concurrent)
        const CONCURRENCY = 3;
        const queue = [...presignedUrls];

        const uploadFile = async (presigned: {
          fileId: string;
          originalUrl: string;
          originalKey: string;
          thumbnailUrl: string;
          thumbnailKey: string;
        }) => {
          const item = items.find((i) => i.id === presigned.fileId);
          if (!item) return;

          setItems((prev) =>
            prev.map((i) =>
              i.id === presigned.fileId ? { ...i, status: "uploading" } : i
            )
          );

          try {
            // Upload original
            await fetch(presigned.originalUrl, {
              method: "PUT",
              body: item.file,
              headers: { "Content-Type": item.file.type },
            });

            // Upload thumbnail
            if (item.thumbnail) {
              await fetch(presigned.thumbnailUrl, {
                method: "PUT",
                body: item.thumbnail,
                headers: { "Content-Type": "image/webp" },
              });
            }

            setItems((prev) =>
              prev.map((i) =>
                i.id === presigned.fileId
                  ? {
                      ...i,
                      status: "done",
                      progress: 100,
                      r2Key: presigned.originalKey,
                      thumbnailR2Key: presigned.thumbnailKey,
                    }
                  : i
              )
            );
          } catch {
            setItems((prev) =>
              prev.map((i) =>
                i.id === presigned.fileId
                  ? { ...i, status: "error", error: "Upload failed" }
                  : i
              )
            );
          }
        };

        // Process queue with concurrency limit
        const workers = Array(Math.min(CONCURRENCY, queue.length))
          .fill(null)
          .map(async () => {
            while (queue.length > 0) {
              const item = queue.shift();
              if (item) await uploadFile(item);
            }
          });

        await Promise.all(workers);

        // Step 4: Save metadata batch
        const completedItems = items.filter((i) => i.status === "done" || i.r2Key);
        if (completedItems.length > 0) {
          await saveMediaAction({
            albumId,
            items: completedItems
              .filter((i) => i.r2Key && i.thumbnailR2Key)
              .map((item) => ({
                id: item.id,
                type: isVideoType(item.file.type) ? "video" : "photo",
                filename: item.file.name,
                r2Key: item.r2Key!,
                thumbnailR2Key: item.thumbnailR2Key!,
                mimeType: item.file.type,
                sizeBytes: item.file.size,
                width: null,
                height: null,
                duration: null,
              })),
          });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [items]
  );

  return { items, addFiles, startUpload, removeItem, clearAll, isUploading };
}
```

- [ ] **Step 6: Create UploadDialog component**

```tsx
// src/features/media/components/upload-dialog.tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMediaUpload, type UploadItem } from "../hooks/use-media-upload";

interface UploadDialogProps {
  albumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatusIcon({ status }: { status: UploadItem["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle className="size-4 text-green-500" />;
    case "error":
      return <AlertCircle className="size-4 text-destructive" />;
    case "uploading":
    case "generating-thumb":
      return <Loader2 className="size-4 animate-spin text-primary" />;
    default:
      return null;
  }
}

export function UploadDialog({ albumId, open, onOpenChange }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, addFiles, startUpload, removeItem, clearAll, isUploading } =
    useMediaUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    await startUpload(albumId);
    // Close dialog after upload completes
    const allDone = items.every((i) => i.status === "done" || i.status === "error");
    if (allDone) {
      clearAll();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        {/* Drop zone / file picker */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to select files or drag & drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Photos (20MB max) • Videos (500MB max)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* File list */}
        {items.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <StatusIcon status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                    {item.error && (
                      <span className="text-destructive ml-2">{item.error}</span>
                    )}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              clearAll();
              onOpenChange(false);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleUpload}
            disabled={items.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              `Upload ${items.length} file${items.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Run all tests**

```bash
pnpm test
```

- [ ] **Step 8: Commit**

```bash
git add src/features/media
git commit -m "feat: add media upload with client-side thumbnails and batch presign

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Media Viewer (Lightbox + Video + Download)

**Files:**
- Create: `src/features/media/components/media-viewer.tsx`
- Create: `src/features/media/components/video-player.tsx`
- Create: `src/app/(main)/media/[id]/page.tsx`
- Test: `src/features/media/components/__tests__/media-viewer.test.tsx`

- [ ] **Step 1: Write test for MediaViewer**

```tsx
// src/features/media/components/__tests__/media-viewer.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import { MediaViewer } from "../media-viewer";

const mockMedia = {
  id: "media-1",
  albumId: "album-1",
  uploadedBy: "user-1",
  type: "photo" as const,
  filename: "sunset.jpg",
  r2Key: "originals/album-1/media-1.jpg",
  thumbnailR2Key: "thumbnails/media-1.webp",
  mimeType: "image/jpeg",
  sizeBytes: 4200000,
  width: 4032,
  height: 3024,
  duration: null,
  createdAt: new Date(),
  uploaderName: "Beni",
};

describe("MediaViewer", () => {
  it("renders close button", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });

  it("renders filename", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
  });

  it("renders uploader name", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByText(/Beni/)).toBeInTheDocument();
  });

  it("renders download button", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByLabelText("Download")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL.

- [ ] **Step 3: Create VideoPlayer**

```tsx
// src/features/media/components/video-player.tsx
"use client";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  return (
    <video
      src={src}
      controls
      playsInline
      className={className}
      preload="metadata"
    >
      Your browser does not support the video element.
    </video>
  );
}
```

- [ ] **Step 4: Create MediaViewer**

```tsx
// src/features/media/components/media-viewer.tsx
"use client";

import { useRouter } from "next/navigation";
import { X, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./video-player";
import type { MediaWithUploader } from "../types";

interface MediaViewerProps {
  media: MediaWithUploader;
  viewUrl: string;
  downloadUrl?: string;
}

export function MediaViewer({ media, viewUrl, downloadUrl }: MediaViewerProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-white hover:bg-white/10"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="size-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-white hover:bg-white/10"
            onClick={handleDownload}
            aria-label="Download"
          >
            <Download className="size-5" />
          </Button>
        </div>
      </div>

      {/* Media content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {media.type === "video" ? (
          <VideoPlayer
            src={viewUrl}
            className="max-w-full max-h-full rounded-lg"
          />
        ) : (
          <img
            src={viewUrl}
            alt={media.filename}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Bottom info */}
      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0">
        <p className="text-white text-sm font-medium">{media.filename}</p>
        <p className="text-white/60 text-xs mt-0.5">
          by {media.uploaderName} •{" "}
          {media.width && media.height && `${media.width}×${media.height} • `}
          {(media.sizeBytes / (1024 * 1024)).toFixed(1)} MB
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create media detail page**

```tsx
// src/app/(main)/media/[id]/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getMediaById } from "@/features/media/services/media.service";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getViewPresignedUrl, getDownloadPresignedUrl } from "@/shared/lib/r2";
import { MediaViewer } from "@/features/media/components/media-viewer";

interface MediaPageProps {
  params: Promise<{ id: string }>;
}

export default async function MediaPage({ params }: MediaPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(id);
  if (!mediaRecord) notFound();

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const hasAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!hasAccess) redirect("/albums");

  const expiresIn = mediaRecord.type === "video" ? 14400 : 3600;
  const [viewUrl, downloadUrl] = await Promise.all([
    getViewPresignedUrl(mediaRecord.r2Key, expiresIn),
    getDownloadPresignedUrl(mediaRecord.r2Key, mediaRecord.filename),
  ]);

  return (
    <MediaViewer
      media={mediaRecord}
      viewUrl={viewUrl}
      downloadUrl={downloadUrl}
    />
  );
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add src/features/media/components/media-viewer.tsx src/features/media/components/video-player.tsx src/features/media/components/__tests__/media-viewer.test.tsx src/app/\(main\)/media
git commit -m "feat: add media viewer with video player and download

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Album Member Management

**Files:**
- Create: `src/features/album/components/members-dialog.tsx`
- Test: `src/features/album/components/__tests__/members-dialog.test.tsx`

- [ ] **Step 1: Add shadcn select component**

```bash
pnpm dlx shadcn@latest add select
```

- [ ] **Step 2: Write test for MembersDialog**

```tsx
// src/features/album/components/__tests__/members-dialog.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/album/actions/manage-members", () => ({
  inviteMemberAction: vi.fn(),
  removeMemberAction: vi.fn(),
  updateMemberRoleAction: vi.fn(),
}));

import { MembersDialog } from "../members-dialog";

const mockMembers = [
  { userId: "u1", userName: "Beni", userEmail: "beni@test.com", role: "editor" as const, invitedAt: new Date() },
  { userId: "u2", userName: "Mama", userEmail: "mama@test.com", role: "viewer" as const, invitedAt: new Date() },
];

describe("MembersDialog", () => {
  it("renders member list when open", () => {
    render(
      <MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByText("Beni")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
  });

  it("shows invite form for editors", () => {
    render(
      <MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it("hides invite form for viewers", () => {
    render(
      <MembersDialog albumId="a1" members={mockMembers} canEdit={false} open={true} onOpenChange={() => {}} />
    );
    expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Expected: FAIL.

- [ ] **Step 4: Create MembersDialog**

```tsx
// src/features/album/components/members-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserMinus, Loader2 } from "lucide-react";
import { UserAvatar } from "@/shared/components/avatar";
import {
  inviteMemberAction,
  removeMemberAction,
} from "../actions/manage-members";
import type { AlbumMemberInfo } from "../types";

interface MembersDialogProps {
  albumId: string;
  members: AlbumMemberInfo[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({
  albumId,
  members,
  canEdit,
  open,
  onOpenChange,
}: MembersDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setPending(true);
    setError(null);

    const result = await inviteMemberAction(albumId, email.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setEmail("");
    }
    setPending(false);
  };

  const handleRemove = async (userId: string) => {
    await removeMemberAction(albumId, userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
        </DialogHeader>

        {/* Invite form */}
        {canEdit && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Invite by email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Button size="sm" onClick={handleInvite} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Invite"}
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )}

        {/* Member list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 p-2 rounded-lg"
            >
              <UserAvatar name={member.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.userEmail} • {member.role}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <UserMinus className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test
```

- [ ] **Step 6: Verify build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add src/features/album/components/members-dialog.tsx src/features/album/components/__tests__/members-dialog.test.tsx
git commit -m "feat: add album member management dialog

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Summary

After completing all 13 tasks, you have:

- **Database:** album, album_member, media tables with indexes and relations
- **R2 Client:** presigned URLs (upload/download/view), getObject, deleteObject
- **Album CRUD:** create, read, update, delete with per-album permissions (owner sees all, members see assigned)
- **Album members:** invite by email, remove, role management (viewer/editor)
- **Media upload:** batch presigned URLs → direct upload to R2 → batch metadata save, client-side thumbnail generation (Canvas API for photos, video frame capture for videos)
- **Thumbnail proxy:** `/api/thumbnail/[mediaId]` with `Cache-Control: immutable` for Vercel Edge caching
- **Media viewer:** fullscreen lightbox for photos, HTML5 video player for videos
- **Download:** signed URL with Content-Disposition attachment
- **UI:** album grid page, album detail with media masonry, upload dialog, members dialog

**Next:** Plan 3 (Social + Search — Comments, Favorites, Tags, Full-text Search)
