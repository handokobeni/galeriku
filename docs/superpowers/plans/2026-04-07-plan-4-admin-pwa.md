# Plan 4: Admin Dashboard + PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build owner-only admin dashboard with stats, user management, album management, storage stats, activity log, and app settings — plus convert the app to a PWA with installable manifest and service worker caching.

**Architecture:** Admin pages live under `(admin)` route group with middleware role check. Activity log table tracks all important events via a service called from server actions. PWA uses `@serwist/next` for service worker generation with route-specific caching strategies.

**Tech Stack:** Drizzle ORM, Server Actions, React Server Components, shadcn/ui, @serwist/next, Workbox

**Spec reference:** `docs/superpowers/specs/2026-04-06-galeriku-design.md` — sections: Admin Dashboard, PWA, ActivityLog data model

**Testing:** Vitest + happy-dom + @testing-library/react. TDD for all tasks. E2E with Playwright against `galeriku_test` DB.

---

## File Map

### Task 1: ActivityLog Schema + Service
- Create: `src/db/schema/activity-log.ts`
- Modify: `src/db/schema/index.ts`
- Create: `src/features/activity/types.ts`
- Create: `src/features/activity/services/activity.service.ts`
- Test: `src/db/schema/__tests__/activity-log.test.ts`
- Test: `src/features/activity/services/__tests__/activity.service.test.ts`

### Task 2: Activity Logging Integration
- Modify: `src/features/album/actions/create-album.ts`
- Modify: `src/features/album/actions/delete-album.ts`
- Modify: `src/features/media/actions/save-media.ts`
- Modify: `src/features/media/actions/delete-media.ts`
- Modify: `src/features/comment/actions/comment-actions.ts`
- Modify: `src/features/album/actions/manage-members.ts`

### Task 3: Admin Middleware & Layout
- Modify: `middleware.ts` (block /admin/* for non-owners — already has check, verify)
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/features/admin/components/admin-sidebar.tsx`

### Task 4: Admin Service (aggregations)
- Create: `src/features/admin/types.ts`
- Create: `src/features/admin/services/admin.service.ts`
- Test: `src/features/admin/services/__tests__/admin.service.test.ts`

### Task 5: Admin Overview Page (Stats)
- Create: `src/features/admin/components/stats-cards.tsx`
- Create: `src/features/admin/components/storage-bar.tsx`
- Create: `src/app/(admin)/admin/page.tsx`
- Test: `src/features/admin/components/__tests__/stats-cards.test.tsx`

### Task 6: User Management Page
- Create: `src/features/admin/services/user-admin.service.ts`
- Create: `src/features/admin/actions/user-admin-actions.ts`
- Create: `src/features/admin/components/user-list.tsx`
- Create: `src/features/admin/components/invite-user-dialog.tsx`
- Create: `src/app/(admin)/admin/users/page.tsx`
- Test: `src/features/admin/components/__tests__/user-list.test.tsx`

### Task 7: Album Management Page
- Create: `src/features/admin/components/album-table.tsx`
- Create: `src/app/(admin)/admin/albums/page.tsx`
- Test: `src/features/admin/components/__tests__/album-table.test.tsx`

### Task 8: Storage Stats Page
- Create: `src/app/(admin)/admin/storage/page.tsx`

### Task 9: Activity Log Page
- Create: `src/features/admin/components/activity-feed.tsx`
- Create: `src/app/(admin)/admin/activity/page.tsx`
- Test: `src/features/admin/components/__tests__/activity-feed.test.tsx`

### Task 10: App Settings Page
- Create: `src/features/admin/services/settings.service.ts`
- Create: `src/features/admin/actions/settings-actions.ts`
- Create: `src/features/admin/components/settings-form.tsx`
- Create: `src/app/(admin)/admin/settings/page.tsx`
- Test: `src/features/admin/components/__tests__/settings-form.test.tsx`

### Task 11: PWA Setup (Manifest + Service Worker)
- Create: `public/manifest.json`
- Create: `public/icons/192.png`, `512.png`, `maskable.png` (placeholders)
- Modify: `next.config.ts` (wrap with @serwist/next)
- Create: `src/app/sw.ts` (service worker source)
- Modify: `src/app/layout.tsx` (link manifest, theme-color)

### Task 12: Offline Indicator + Install Prompt
- Create: `src/shared/components/offline-indicator.tsx`
- Create: `src/shared/components/install-prompt.tsx`
- Modify: `src/shared/components/app-shell.tsx`
- Test: `src/shared/components/__tests__/offline-indicator.test.tsx`

---

## Task 1: ActivityLog Schema + Service

**Files:**
- Create: `src/db/schema/activity-log.ts`
- Modify: `src/db/schema/index.ts`
- Create: `src/features/activity/types.ts`
- Create: `src/features/activity/services/activity.service.ts`
- Test: `src/db/schema/__tests__/activity-log.test.ts`
- Test: `src/features/activity/services/__tests__/activity.service.test.ts`

- [ ] **Step 1: Write failing test for schema**

```typescript
// src/db/schema/__tests__/activity-log.test.ts
import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { activityLog } from "../activity-log";

describe("activityLog table", () => {
  it("has correct table name", () => {
    expect(getTableName(activityLog)).toBe("activity_log");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(activityLog);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("action");
    expect(columns).toHaveProperty("entityType");
    expect(columns).toHaveProperty("entityId");
    expect(columns).toHaveProperty("metadata");
    expect(columns).toHaveProperty("ipAddress");
    expect(columns).toHaveProperty("userAgent");
    expect(columns).toHaveProperty("createdAt");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --run src/db/schema/__tests__/activity-log.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create activity-log schema**

```typescript
// src/db/schema/activity-log.ts
import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./user";

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_log_userId_idx").on(table.userId),
    index("activity_log_createdAt_idx").on(table.createdAt),
  ],
);
```

- [ ] **Step 4: Update barrel export**

Add to `src/db/schema/index.ts`:

```typescript
export * from "./activity-log";
```

- [ ] **Step 5: Create types**

```typescript
// src/features/activity/types.ts
export type ActivityAction =
  | "login"
  | "login_failed"
  | "logout"
  | "user_invited"
  | "user_deactivated"
  | "album_created"
  | "album_deleted"
  | "media_uploaded"
  | "media_deleted"
  | "comment_created"
  | "member_added"
  | "member_removed"
  | "settings_changed";

export type EntityType = "user" | "album" | "media" | "comment" | "settings";

export interface ActivityLogEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
```

- [ ] **Step 6: Write failing test for service**

```typescript
// src/features/activity/services/__tests__/activity.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    offset: vi.fn().mockReturnThis(),
  },
}));

import { logActivity, getRecentActivity } from "../activity.service";

describe("Activity service", () => {
  it("exports logActivity", () => {
    expect(typeof logActivity).toBe("function");
  });
  it("exports getRecentActivity", () => {
    expect(typeof getRecentActivity).toBe("function");
  });
});
```

- [ ] **Step 7: Create service**

```typescript
// src/features/activity/services/activity.service.ts
import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ActivityAction, EntityType } from "../types";

export async function logActivity(data: {
  userId?: string | null;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.insert(activityLog).values({
    userId: data.userId ?? null,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId ?? null,
    metadata: data.metadata ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
  });
}

export async function getRecentActivity(limit = 50, offset = 0) {
  return db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      userName: user.name,
      action: activityLog.action,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(user, eq(activityLog.userId, user.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);
}
```

- [ ] **Step 8: Run all tests, generate migration, apply**

```bash
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:test:migrate
```

- [ ] **Step 9: Commit**

```bash
git add src/db/schema src/db/migrations src/features/activity
git commit -m "feat: add activity_log table and activity service

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Activity Logging Integration

**Files (modify each to log events):**

- [ ] **Step 1: Add logActivity calls to album actions**

In `src/features/album/actions/create-album.ts`, after `await createAlbum(...)`, add:

```typescript
import { logActivity } from "@/features/activity/services/activity.service";

// ...inside try, after createAlbum:
await logActivity({
  userId: session.user.id,
  action: "album_created",
  entityType: "album",
  entityId: newAlbum.id,
  metadata: { name: parsed.data.name },
});
```

Note: `createAlbum` returns the new album record. Update the call to capture it:

```typescript
const newAlbum = await createAlbum({
  name: parsed.data.name,
  description: parsed.data.description,
  createdBy: session.user.id,
});

await logActivity({
  userId: session.user.id,
  action: "album_created",
  entityType: "album",
  entityId: newAlbum.id,
  metadata: { name: parsed.data.name },
});
```

- [ ] **Step 2: Add logActivity to delete-album action**

In `src/features/album/actions/delete-album.ts`, before/after `deleteAlbum(albumId)`:

```typescript
import { logActivity } from "@/features/activity/services/activity.service";
import { getAlbumById } from "../services/album.service";

// Inside the function, after permission check:
const albumRecord = await getAlbumById(albumId);
await deleteAlbum(albumId);
await logActivity({
  userId: session.user.id,
  action: "album_deleted",
  entityType: "album",
  entityId: albumId,
  metadata: { name: albumRecord?.name ?? null },
});
```

- [ ] **Step 3: Add logActivity to media save/delete actions**

In `src/features/media/actions/save-media.ts`, after `saveMediaBatch(...)`:

```typescript
import { logActivity } from "@/features/activity/services/activity.service";

// After saveMediaBatch:
await logActivity({
  userId: session.user.id,
  action: "media_uploaded",
  entityType: "media",
  entityId: null,
  metadata: { albumId, count: items.length },
});
```

In `src/features/media/actions/delete-media.ts`, after `deleteMediaById(mediaId)`:

```typescript
import { logActivity } from "@/features/activity/services/activity.service";

// After deleteMediaById:
await logActivity({
  userId: session.user.id,
  action: "media_deleted",
  entityType: "media",
  entityId: mediaId,
  metadata: { filename: mediaRecord.filename },
});
```

- [ ] **Step 4: Add logActivity to comment + member actions**

In `src/features/comment/actions/comment-actions.ts` `addCommentAction`, after `addComment(...)`:

```typescript
import { logActivity } from "@/features/activity/services/activity.service";

await logActivity({
  userId: session.user.id,
  action: "comment_created",
  entityType: "comment",
  entityId: null,
  metadata: { mediaId },
});
```

In `src/features/album/actions/manage-members.ts`:
- After `addAlbumMember(...)` in both invite actions, log `member_added` with `metadata: { albumId, addedUserId: userId }`
- After `removeAlbumMember(...)`, log `member_removed`

- [ ] **Step 5: Run tests + build + commit**

```bash
pnpm test
pnpm build
git add src/features
git commit -m "feat: log activity events from album, media, comment, member actions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Admin Layout + Sidebar

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/features/admin/components/admin-sidebar.tsx`

- [ ] **Step 1: Create admin layout**

```tsx
// src/app/(admin)/layout.tsx
import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") redirect("/albums");

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create AdminSidebar**

```tsx
// src/features/admin/components/admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  HardDrive,
  Activity,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/albums", icon: FolderOpen, label: "Albums" },
  { href: "/admin/storage", icon: HardDrive, label: "Storage" },
  { href: "/admin/activity", icon: Activity, label: "Activity" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <Link href="/albums" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to app
        </Link>
        <h2 className="mt-3 text-lg font-bold tracking-tight">Admin</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(admin)" src/features/admin
git commit -m "feat: add admin layout with sidebar navigation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Admin Service (Aggregations)

**Files:**
- Create: `src/features/admin/types.ts`
- Create: `src/features/admin/services/admin.service.ts`
- Test: `src/features/admin/services/__tests__/admin.service.test.ts`

- [ ] **Step 1: Create types**

```typescript
// src/features/admin/types.ts
export interface AdminStats {
  totalUsers: number;
  totalAlbums: number;
  totalMedia: number;
  totalPhotos: number;
  totalVideos: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

export interface UserStat {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  albumCount: number;
  uploadCount: number;
}

export interface AlbumStat {
  id: string;
  name: string;
  createdBy: string;
  creatorName: string;
  createdAt: Date;
  mediaCount: number;
  memberCount: number;
  storageBytes: number;
}
```

- [ ] **Step 2: Write failing test**

```typescript
// src/features/admin/services/__tests__/admin.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

import { getAdminStats, getAllAlbumsForAdmin, getAllUsersForAdmin } from "../admin.service";

describe("Admin service", () => {
  it("exports getAdminStats", () => { expect(typeof getAdminStats).toBe("function"); });
  it("exports getAllAlbumsForAdmin", () => { expect(typeof getAllAlbumsForAdmin).toBe("function"); });
  it("exports getAllUsersForAdmin", () => { expect(typeof getAllUsersForAdmin).toBe("function"); });
});
```

- [ ] **Step 3: Implement admin service**

```typescript
// src/features/admin/services/admin.service.ts
import { db } from "@/db";
import { user, album, media, albumMember } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import type { AdminStats, UserStat, AlbumStat } from "../types";

const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10GB R2 free tier

export async function getAdminStats(): Promise<AdminStats> {
  const [userCountRow] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(user);
  const [albumCountRow] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(album);
  const [mediaCountRow] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      photos: sql<number>`COUNT(CASE WHEN type = 'photo' THEN 1 END)::int`,
      videos: sql<number>`COUNT(CASE WHEN type = 'video' THEN 1 END)::int`,
      bytes: sql<number>`COALESCE(SUM(size_bytes), 0)::bigint`,
    })
    .from(media);

  return {
    totalUsers: userCountRow.count,
    totalAlbums: albumCountRow.count,
    totalMedia: mediaCountRow.total,
    totalPhotos: mediaCountRow.photos,
    totalVideos: mediaCountRow.videos,
    storageUsedBytes: Number(mediaCountRow.bytes),
    storageLimitBytes: STORAGE_LIMIT_BYTES,
  };
}

export async function getAllUsersForAdmin(): Promise<UserStat[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      albumCount: sql<number>`(SELECT COUNT(*) FROM album WHERE album.created_by = ${user.id})::int`,
      uploadCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.uploaded_by = ${user.id})::int`,
    })
    .from(user)
    .orderBy(user.createdAt) as Promise<UserStat[]>;
}

export async function getAllAlbumsForAdmin(): Promise<AlbumStat[]> {
  return db
    .select({
      id: album.id,
      name: album.name,
      createdBy: album.createdBy,
      creatorName: user.name,
      createdAt: album.createdAt,
      mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.album_id = ${album.id})::int`,
      memberCount: sql<number>`(SELECT COUNT(*) FROM album_member WHERE album_member.album_id = ${album.id})::int`,
      storageBytes: sql<number>`(SELECT COALESCE(SUM(size_bytes), 0) FROM media WHERE media.album_id = ${album.id})::bigint`,
    })
    .from(album)
    .innerJoin(user, eq(album.createdBy, user.id))
    .orderBy(album.createdAt) as Promise<AlbumStat[]>;
}

export async function getStorageByAlbum() {
  return getAllAlbumsForAdmin();
}
```

- [ ] **Step 4: Run tests + commit**

```bash
pnpm test
git add src/features/admin
git commit -m "feat: add admin service with stats and admin queries

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Admin Overview Page (Stats Cards)

**Files:**
- Create: `src/features/admin/components/stats-cards.tsx`
- Create: `src/features/admin/components/storage-bar.tsx`
- Create: `src/app/(admin)/admin/page.tsx`
- Test: `src/features/admin/components/__tests__/stats-cards.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/admin/components/__tests__/stats-cards.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatsCards } from "../stats-cards";

describe("StatsCards", () => {
  it("renders all stats", () => {
    render(
      <StatsCards
        stats={{
          totalUsers: 5,
          totalAlbums: 12,
          totalMedia: 200,
          totalPhotos: 180,
          totalVideos: 20,
          storageUsedBytes: 1024 * 1024 * 1024,
          storageLimitBytes: 10 * 1024 * 1024 * 1024,
        }}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create StatsCards**

```tsx
// src/features/admin/components/stats-cards.tsx
import { Users, FolderOpen, ImageIcon, HardDrive } from "lucide-react";
import type { AdminStats } from "../types";

interface StatsCardsProps {
  stats: AdminStats;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Users,
      label: "Total Users",
      value: stats.totalUsers,
      sub: null,
    },
    {
      icon: FolderOpen,
      label: "Total Albums",
      value: stats.totalAlbums,
      sub: null,
    },
    {
      icon: ImageIcon,
      label: "Total Media",
      value: stats.totalMedia,
      sub: `${stats.totalPhotos} photos · ${stats.totalVideos} videos`,
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: formatBytes(stats.storageUsedBytes),
      sub: `of ${formatBytes(stats.storageLimitBytes)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <card.icon className="size-4" />
            <span className="text-xs uppercase tracking-wide">{card.label}</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{card.value}</div>
          {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create StorageBar**

```tsx
// src/features/admin/components/storage-bar.tsx
interface StorageBarProps {
  used: number;
  limit: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StorageBar({ used, limit }: StorageBarProps) {
  const pct = Math.min(100, (used / limit) * 100);
  const isWarning = pct > 80;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">R2 Storage</h3>
        <span className="text-xs text-muted-foreground">
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isWarning ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">{pct.toFixed(1)}% used</p>
    </div>
  );
}
```

- [ ] **Step 4: Create admin overview page**

```tsx
// src/app/(admin)/admin/page.tsx
import { getAdminStats } from "@/features/admin/services/admin.service";
import { StatsCards } from "@/features/admin/components/stats-cards";
import { StorageBar } from "@/features/admin/components/storage-bar";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">System statistics and storage usage</p>
      </div>
      <StatsCards stats={stats} />
      <StorageBar used={stats.storageUsedBytes} limit={stats.storageLimitBytes} />
    </div>
  );
}
```

- [ ] **Step 5: Run tests + commit**

```bash
pnpm test
git add src/features/admin "src/app/(admin)/admin/page.tsx"
git commit -m "feat: add admin overview page with stats cards

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: User Management Page

**Files:**
- Create: `src/features/admin/services/user-admin.service.ts`
- Create: `src/features/admin/actions/user-admin-actions.ts`
- Create: `src/features/admin/components/user-list.tsx`
- Create: `src/features/admin/components/invite-user-dialog.tsx`
- Create: `src/app/(admin)/admin/users/page.tsx`
- Test: `src/features/admin/components/__tests__/user-list.test.tsx`

- [ ] **Step 1: Create user admin service**

```typescript
// src/features/admin/services/user-admin.service.ts
import { db } from "@/db";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteUserById(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

export async function getUserById(userId: string) {
  const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  return u ?? null;
}

export async function resetUserPassword(userId: string, hashedPassword: string) {
  await db
    .update(account)
    .set({ password: hashedPassword })
    .where(eq(account.userId, userId));
}
```

- [ ] **Step 2: Create user admin actions**

```typescript
// src/features/admin/actions/user-admin-actions.ts
"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/lib/auth";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteUserById } from "../services/user-admin.service";
import { logActivity } from "@/features/activity/services/activity.service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const inviteSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export type InviteUserState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function inviteUserAction(
  _prev: InviteUserState,
  formData: FormData
): Promise<InviteUserState> {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") return { error: "Permission denied" };

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        username: parsed.data.username,
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Failed to create user. Email or username may already exist." };
  }

  await logActivity({
    userId: session.user.id,
    action: "user_invited",
    entityType: "user",
    entityId: null,
    metadata: { email: parsed.data.email },
  });

  revalidatePath("/admin/users");
  return {};
}

export async function deleteUserAction(userId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") return { error: "Permission denied" };
  if (userId === session.user.id) return { error: "Cannot delete yourself" };

  // Don't allow deleting other owners
  const [target] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (target?.role === "owner") return { error: "Cannot delete an owner" };

  await deleteUserById(userId);
  await logActivity({
    userId: session.user.id,
    action: "user_deactivated",
    entityType: "user",
    entityId: userId,
    metadata: {},
  });

  revalidatePath("/admin/users");
  return { success: true };
}
```

- [ ] **Step 3: Write failing test for UserList**

```tsx
// src/features/admin/components/__tests__/user-list.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/actions/user-admin-actions", () => ({
  deleteUserAction: vi.fn(),
}));

import { UserList } from "../user-list";

const mockUsers = [
  { id: "u1", name: "Owner", email: "owner@test.com", role: "owner", createdAt: new Date(), albumCount: 5, uploadCount: 100 },
  { id: "u2", name: "Member", email: "member@test.com", role: "member", createdAt: new Date(), albumCount: 2, uploadCount: 30 },
];

describe("UserList", () => {
  it("renders all users", () => {
    render(<UserList users={mockUsers} currentUserId="u1" />);
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
  });
  it("shows role badges", () => {
    render(<UserList users={mockUsers} currentUserId="u1" />);
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Create UserList**

```tsx
// src/features/admin/components/user-list.tsx
"use client";

import { UserAvatar } from "@/shared/components/avatar";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "../actions/user-admin-actions";
import type { UserStat } from "../types";

interface UserListProps {
  users: UserStat[];
  currentUserId: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await deleteUserAction(userId);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-right px-4 py-3 font-medium">Albums</th>
            <th className="text-right px-4 py-3 font-medium">Uploads</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={u.name} size="sm" />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.role === "owner" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right">{u.albumCount}</td>
              <td className="px-4 py-3 text-right">{u.uploadCount}</td>
              <td className="px-4 py-3 text-right">
                {u.role !== "owner" && u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete user"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Create InviteUserDialog**

```tsx
// src/features/admin/components/invite-user-dialog.tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { inviteUserAction, type InviteUserState } from "../actions/user-admin-actions";

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<InviteUserState, FormData>(
    async (prev, formData) => {
      const result = await inviteUserAction(prev, formData);
      if (!result.error && !result.fieldErrors) setOpen(false);
      return result;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="size-4 mr-2" />
            Invite User
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" required />
            {state.fieldErrors?.name && <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
            {state.fieldErrors?.username && <p className="text-destructive text-xs">{state.fieldErrors.username[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            {state.fieldErrors?.email && <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            {state.fieldErrors?.password && <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Create users page**

```tsx
// src/app/(admin)/admin/users/page.tsx
import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllUsersForAdmin } from "@/features/admin/services/admin.service";
import { UserList } from "@/features/admin/components/user-list";
import { InviteUserDialog } from "@/features/admin/components/invite-user-dialog";

export default async function AdminUsersPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const users = await getAllUsersForAdmin();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
        </div>
        <InviteUserDialog />
      </div>
      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
```

- [ ] **Step 7: Run tests + commit**

```bash
pnpm test
pnpm build
git add src/features/admin "src/app/(admin)/admin/users"
git commit -m "feat: add admin user management page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Album Management Page

**Files:**
- Create: `src/features/admin/components/album-table.tsx`
- Create: `src/app/(admin)/admin/albums/page.tsx`
- Test: `src/features/admin/components/__tests__/album-table.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/admin/components/__tests__/album-table.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/features/album/actions/delete-album", () => ({
  deleteAlbumAction: vi.fn(),
}));

import { AlbumTable } from "../album-table";

const mockAlbums = [
  {
    id: "a1",
    name: "Liburan Bali",
    createdBy: "u1",
    creatorName: "Beni",
    createdAt: new Date(),
    mediaCount: 100,
    memberCount: 3,
    storageBytes: 1024 * 1024 * 50,
  },
];

describe("AlbumTable", () => {
  it("renders album rows", () => {
    render(<AlbumTable albums={mockAlbums} />);
    expect(screen.getByText("Liburan Bali")).toBeInTheDocument();
    expect(screen.getByText("Beni")).toBeInTheDocument();
  });
  it("renders media count", () => {
    render(<AlbumTable albums={mockAlbums} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create AlbumTable**

```tsx
// src/features/admin/components/album-table.tsx
"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteAlbumAction } from "@/features/album/actions/delete-album";
import type { AlbumStat } from "../types";

interface AlbumTableProps {
  albums: AlbumStat[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AlbumTable({ albums }: AlbumTableProps) {
  const handleDelete = async (albumId: string) => {
    if (!confirm("Delete this album and all its media?")) return;
    await deleteAlbumAction(albumId);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Album</th>
            <th className="text-left px-4 py-3 font-medium">Creator</th>
            <th className="text-right px-4 py-3 font-medium">Media</th>
            <th className="text-right px-4 py-3 font-medium">Members</th>
            <th className="text-right px-4 py-3 font-medium">Storage</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {albums.map((a) => (
            <tr key={a.id} className="border-t border-border">
              <td className="px-4 py-3">
                <Link href={`/albums/${a.id}`} className="font-medium hover:underline">
                  {a.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{a.creatorName}</td>
              <td className="px-4 py-3 text-right">{a.mediaCount}</td>
              <td className="px-4 py-3 text-right">{a.memberCount}</td>
              <td className="px-4 py-3 text-right">{formatBytes(Number(a.storageBytes))}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete album"
                >
                  <Trash2 className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create albums page**

```tsx
// src/app/(admin)/admin/albums/page.tsx
import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllAlbumsForAdmin } from "@/features/admin/services/admin.service";
import { AlbumTable } from "@/features/admin/components/album-table";

export default async function AdminAlbumsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const albums = await getAllAlbumsForAdmin();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Albums</h1>
        <p className="text-sm text-muted-foreground">{albums.length} total albums</p>
      </div>
      <AlbumTable albums={albums} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests + commit**

```bash
pnpm test
git add src/features/admin "src/app/(admin)/admin/albums"
git commit -m "feat: add admin album management page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Storage Stats Page

**Files:**
- Create: `src/app/(admin)/admin/storage/page.tsx`

- [ ] **Step 1: Create storage page**

```tsx
// src/app/(admin)/admin/storage/page.tsx
import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAdminStats, getStorageByAlbum } from "@/features/admin/services/admin.service";
import { StorageBar } from "@/features/admin/components/storage-bar";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminStoragePage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const [stats, perAlbum] = await Promise.all([
    getAdminStats(),
    getStorageByAlbum(),
  ]);

  const sortedAlbums = [...perAlbum].sort(
    (a, b) => Number(b.storageBytes) - Number(a.storageBytes)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
        <p className="text-sm text-muted-foreground">R2 storage usage breakdown</p>
      </div>

      <StorageBar used={stats.storageUsedBytes} limit={stats.storageLimitBytes} />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Per Album</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Album</th>
              <th className="text-left px-4 py-2 font-medium">Creator</th>
              <th className="text-right px-4 py-2 font-medium">Media</th>
              <th className="text-right px-4 py-2 font-medium">Storage</th>
            </tr>
          </thead>
          <tbody>
            {sortedAlbums.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-2">{a.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{a.creatorName}</td>
                <td className="px-4 py-2 text-right">{a.mediaCount}</td>
                <td className="px-4 py-2 text-right">{formatBytes(Number(a.storageBytes))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(admin)/admin/storage"
git commit -m "feat: add admin storage stats page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Activity Log Page

**Files:**
- Create: `src/features/admin/components/activity-feed.tsx`
- Create: `src/app/(admin)/admin/activity/page.tsx`
- Test: `src/features/admin/components/__tests__/activity-feed.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/admin/components/__tests__/activity-feed.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActivityFeed } from "../activity-feed";

const mockActivities = [
  {
    id: "1",
    userId: "u1",
    userName: "Beni",
    action: "album_created" as const,
    entityType: "album" as const,
    entityId: "a1",
    metadata: { name: "Bali" },
    createdAt: new Date(),
  },
];

describe("ActivityFeed", () => {
  it("renders activity entries", () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText(/Beni/)).toBeInTheDocument();
  });
  it("shows empty state when no activities", () => {
    render(<ActivityFeed activities={[]} />);
    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create ActivityFeed**

```tsx
// src/features/admin/components/activity-feed.tsx
import {
  LogIn,
  LogOut,
  AlertCircle,
  UserPlus,
  UserMinus,
  FolderPlus,
  FolderMinus,
  Upload,
  Trash2,
  MessageSquare,
  Settings,
  Activity as ActivityIcon,
} from "lucide-react";
import type { ActivityLogEntry } from "@/features/activity/types";

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
}

const iconMap: Record<string, typeof ActivityIcon> = {
  login: LogIn,
  login_failed: AlertCircle,
  logout: LogOut,
  user_invited: UserPlus,
  user_deactivated: UserMinus,
  album_created: FolderPlus,
  album_deleted: FolderMinus,
  media_uploaded: Upload,
  media_deleted: Trash2,
  comment_created: MessageSquare,
  member_added: UserPlus,
  member_removed: UserMinus,
  settings_changed: Settings,
};

const colorMap: Record<string, string> = {
  login: "text-blue-500",
  login_failed: "text-destructive",
  logout: "text-muted-foreground",
  album_created: "text-green-500",
  album_deleted: "text-destructive",
  media_uploaded: "text-green-500",
  media_deleted: "text-destructive",
};

function describeAction(entry: ActivityLogEntry): string {
  const meta = entry.metadata ?? {};
  switch (entry.action) {
    case "login":
      return "logged in";
    case "logout":
      return "logged out";
    case "login_failed":
      return "failed login attempt";
    case "album_created":
      return `created album "${meta.name ?? ""}"`;
    case "album_deleted":
      return `deleted album "${meta.name ?? ""}"`;
    case "media_uploaded":
      return `uploaded ${meta.count ?? 0} item(s)`;
    case "media_deleted":
      return `deleted ${meta.filename ?? "media"}`;
    case "comment_created":
      return "added a comment";
    case "user_invited":
      return `invited user ${meta.email ?? ""}`;
    case "user_deactivated":
      return "removed a user";
    case "member_added":
      return "added a member to album";
    case "member_removed":
      return "removed a member from album";
    case "settings_changed":
      return "updated settings";
    default:
      return entry.action;
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ActivityIcon className="size-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {activities.map((entry) => {
        const Icon = iconMap[entry.action] ?? ActivityIcon;
        const color = colorMap[entry.action] ?? "text-muted-foreground";
        return (
          <div key={entry.id} className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{entry.userName ?? "Unknown"}</span>{" "}
                <span className="text-muted-foreground">{describeAction(entry)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {timeAgo(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create activity page**

```tsx
// src/app/(admin)/admin/activity/page.tsx
import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getRecentActivity } from "@/features/activity/services/activity.service";
import { ActivityFeed } from "@/features/admin/components/activity-feed";
import type { ActivityLogEntry } from "@/features/activity/types";

export default async function AdminActivityPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const activities = (await getRecentActivity(100)) as unknown as ActivityLogEntry[];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">Recent system events</p>
      </div>
      <ActivityFeed activities={activities} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests + commit**

```bash
pnpm test
git add src/features/admin "src/app/(admin)/admin/activity"
git commit -m "feat: add admin activity log page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: App Settings Page

**Files:**
- Create: `src/features/admin/services/settings.service.ts`
- Create: `src/features/admin/actions/settings-actions.ts`
- Create: `src/features/admin/components/settings-form.tsx`
- Create: `src/app/(admin)/admin/settings/page.tsx`
- Test: `src/features/admin/components/__tests__/settings-form.test.tsx`

- [ ] **Step 1: Create settings service**

```typescript
// src/features/admin/services/settings.service.ts
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AppSettingsValues {
  app_name: string;
  registration_open: boolean;
  max_upload_photo_mb: number;
  max_upload_video_mb: number;
  storage_warning_pct: number;
}

export async function getAllSettings(): Promise<AppSettingsValues> {
  const rows = await db.select().from(appSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    app_name: (map.app_name as string) ?? "Galeriku",
    registration_open: (map.registration_open as boolean) ?? false,
    max_upload_photo_mb: (map.max_upload_photo_mb as number) ?? 20,
    max_upload_video_mb: (map.max_upload_video_mb as number) ?? 500,
    storage_warning_pct: (map.storage_warning_pct as number) ?? 80,
  };
}

export async function updateSetting(key: string, value: unknown) {
  await db
    .update(appSettings)
    .set({ value: value as never, updatedAt: new Date() })
    .where(eq(appSettings.key, key));
}
```

- [ ] **Step 2: Create settings actions**

```typescript
// src/features/admin/actions/settings-actions.ts
"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { updateSetting } from "../services/settings.service";
import { logActivity } from "@/features/activity/services/activity.service";
import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  app_name: z.string().min(1).max(100),
  registration_open: z.boolean(),
  max_upload_photo_mb: z.number().int().min(1).max(100),
  max_upload_video_mb: z.number().int().min(1).max(2000),
  storage_warning_pct: z.number().int().min(50).max(99),
});

export async function updateSettingsAction(
  data: z.infer<typeof settingsSchema>
) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") return { error: "Permission denied" };

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await Promise.all([
    updateSetting("app_name", parsed.data.app_name),
    updateSetting("registration_open", parsed.data.registration_open),
    updateSetting("max_upload_photo_mb", parsed.data.max_upload_photo_mb),
    updateSetting("max_upload_video_mb", parsed.data.max_upload_video_mb),
    updateSetting("storage_warning_pct", parsed.data.storage_warning_pct),
  ]);

  await logActivity({
    userId: session.user.id,
    action: "settings_changed",
    entityType: "settings",
    entityId: null,
    metadata: { ...parsed.data },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
```

- [ ] **Step 3: Write failing test for SettingsForm**

```tsx
// src/features/admin/components/__tests__/settings-form.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/actions/settings-actions", () => ({
  updateSettingsAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { SettingsForm } from "../settings-form";

const initial = {
  app_name: "Galeriku",
  registration_open: false,
  max_upload_photo_mb: 20,
  max_upload_video_mb: 500,
  storage_warning_pct: 80,
};

describe("SettingsForm", () => {
  it("renders all settings fields", () => {
    render(<SettingsForm initial={initial} />);
    expect(screen.getByLabelText(/app name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/registration open/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max photo size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max video size/i)).toBeInTheDocument();
  });
  it("uses initial values", () => {
    render(<SettingsForm initial={initial} />);
    expect((screen.getByLabelText(/app name/i) as HTMLInputElement).value).toBe("Galeriku");
  });
});
```

- [ ] **Step 4: Create SettingsForm**

```tsx
// src/features/admin/components/settings-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "../actions/settings-actions";
import type { AppSettingsValues } from "../services/settings.service";

interface SettingsFormProps {
  initial: AppSettingsValues;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [values, setValues] = useState<AppSettingsValues>(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await updateSettingsAction(values);
    if (result.success) {
      setMessage("Settings saved");
    } else {
      setMessage(result.error ?? "Failed to save");
    }
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="app_name">App Name</Label>
        <Input
          id="app_name"
          value={values.app_name}
          onChange={(e) => setValues({ ...values, app_name: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="registration_open">Registration Open</Label>
        <input
          id="registration_open"
          type="checkbox"
          checked={values.registration_open}
          onChange={(e) =>
            setValues({ ...values, registration_open: e.target.checked })
          }
          className="size-4"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_photo">Max Photo Size (MB)</Label>
        <Input
          id="max_photo"
          aria-label="Max Photo Size"
          type="number"
          value={values.max_upload_photo_mb}
          onChange={(e) =>
            setValues({ ...values, max_upload_photo_mb: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_video">Max Video Size (MB)</Label>
        <Input
          id="max_video"
          aria-label="Max Video Size"
          type="number"
          value={values.max_upload_video_mb}
          onChange={(e) =>
            setValues({ ...values, max_upload_video_mb: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storage_warning">Storage Warning (%)</Label>
        <Input
          id="storage_warning"
          type="number"
          value={values.storage_warning_pct}
          onChange={(e) =>
            setValues({ ...values, storage_warning_pct: Number(e.target.value) })
          }
        />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Create settings page**

```tsx
// src/app/(admin)/admin/settings/page.tsx
import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllSettings } from "@/features/admin/services/settings.service";
import { SettingsForm } from "@/features/admin/components/settings-form";

export default async function AdminSettingsPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const settings = await getAllSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Application configuration</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
```

- [ ] **Step 6: Run tests + commit**

```bash
pnpm test
pnpm build
git add src/features/admin "src/app/(admin)/admin/settings"
git commit -m "feat: add admin settings page with app config form

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: PWA Setup (Manifest + Service Worker)

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)
- Modify: `next.config.ts`
- Create: `src/app/sw.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install @serwist/next**

```bash
pnpm add @serwist/next serwist
```

- [ ] **Step 2: Create manifest**

```json
// public/manifest.json
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
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 3: Create placeholder icons**

```bash
mkdir -p public/icons
# Use a tool or copy a placeholder PNG. For now, create minimal placeholders:
# You can use ImageMagick if available, or download a placeholder.
# As a stopgap, use the favicon as the source:
cp public/favicon.ico public/icons/icon-192.ico 2>/dev/null || true
```

Note: For real deployment, generate proper PNG icons. For development, the manifest will reference paths that may 404 — that's OK for the SW to still work.

- [ ] **Step 4: Create service worker source**

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

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
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

- [ ] **Step 5: Update next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
];

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@node-rs/argon2", "@aws-sdk/client-s3"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSerwist(nextConfig);
```

- [ ] **Step 6: Update layout to link manifest**

In `src/app/layout.tsx`, update the metadata export to include manifest:

```typescript
export const metadata: Metadata = {
  title: "Galeriku",
  description: "Personal photo & video gallery",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Galeriku",
  },
};
```

- [ ] **Step 7: Add public/sw.js to .gitignore**

```bash
echo "" >> .gitignore
echo "# generated service worker" >> .gitignore
echo "public/sw.js" >> .gitignore
echo "public/swe-worker-*.js" >> .gitignore
```

- [ ] **Step 8: Verify build**

```bash
pnpm build
```

Expected: Build succeeds, `public/sw.js` is generated.

- [ ] **Step 9: Commit**

```bash
git add public/manifest.json public/icons next.config.ts src/app/sw.ts src/app/layout.tsx .gitignore package.json pnpm-lock.yaml
git commit -m "feat: add PWA manifest and service worker via @serwist/next

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Offline Indicator + Install Prompt

**Files:**
- Create: `src/shared/components/offline-indicator.tsx`
- Create: `src/shared/components/install-prompt.tsx`
- Modify: `src/shared/components/app-shell.tsx`
- Test: `src/shared/components/__tests__/offline-indicator.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/shared/components/__tests__/offline-indicator.test.tsx
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { OfflineIndicator } from "../offline-indicator";

describe("OfflineIndicator", () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  it("does not render when online", () => {
    render(<OfflineIndicator />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  it("renders when offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      writable: true,
      value: false,
    });
    render(<OfflineIndicator />);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create OfflineIndicator**

```tsx
// src/shared/components/offline-indicator.tsx
"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs py-1.5 px-3 flex items-center justify-center gap-2">
      <WifiOff className="size-3.5" />
      <span>You&apos;re offline — showing cached content</span>
    </div>
  );
}
```

- [ ] **Step 3: Create InstallPrompt**

```tsx
// src/shared/components/install-prompt.tsx
"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const handleInstall = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 bg-card border border-border rounded-2xl shadow-lg p-4 max-w-xs">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Install Galeriku</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add to home screen for quick access
          </p>
          <Button size="sm" className="mt-3" onClick={handleInstall}>
            <Download className="size-3.5 mr-1.5" />
            Install
          </Button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into app shell**

Modify `src/shared/components/app-shell.tsx` to include the indicators:

```tsx
import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";
import { OfflineIndicator } from "./offline-indicator";
import { InstallPrompt } from "./install-prompt";
import type { AuthUser } from "@/features/auth/types";

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-svh flex flex-col">
      <OfflineIndicator />
      <TopNav user={user} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav isOwner={user.role === "owner"} />
      <InstallPrompt />
    </div>
  );
}
```

- [ ] **Step 5: Run tests + build + commit**

```bash
pnpm test
pnpm build
git add src/shared/components
git commit -m "feat: add offline indicator and install prompt for PWA

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Summary

After completing all 12 tasks:

- **ActivityLog table** + service tracking all important events
- **Activity logging** integrated into album, media, comment, member actions
- **Admin layout** with sidebar navigation (owner-only via middleware)
- **Admin overview** with stats cards + storage bar
- **User management** page with invite, delete, role badges
- **Album management** page with all albums + delete
- **Storage stats** page with per-album breakdown
- **Activity log** page with timeline of events
- **App settings** page with editable config
- **PWA manifest** + service worker via @serwist/next
- **Offline indicator** banner + **install prompt** popup

**Final state:** Full-featured personal gallery app with auth, albums, media upload, comments, favorites, tags, search, admin dashboard, and PWA support.
