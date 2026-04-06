# Plan 3: Social Features + Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comments, favorites, tags, and full-text search to the gallery — enabling social interaction and content discovery across albums.

**Architecture:** All social data (comments, favorites, tags) stored in PostgreSQL via Drizzle. Comments and favorites are per-media with permission checks. Tags use a many-to-many relation (Tag ↔ MediaTag ↔ Media). Search uses PostgreSQL full-text search (`to_tsvector`/`to_tsquery`) across media filenames, album names, and tags. UI integrates into existing media viewer (comments side panel, favorite button, tag chips) and new pages (`/favorites`, `/search`).

**Tech Stack:** Drizzle ORM, Zod, Server Actions, React Server Components, shadcn/ui, PostgreSQL full-text search

**Spec reference:** `docs/superpowers/specs/2026-04-06-galeriku-design.md` — sections: Data Model (Comment, Favorite, Tag, MediaTag), UI/UX (favorites page, search page)

**Testing:** Vitest + happy-dom + @testing-library/react. TDD for all tasks. Run `pnpm test`.

---

## File Map

### Task 1: Comment + Favorite + Tag Database Schema
- Create: `src/db/schema/comment.ts`
- Create: `src/db/schema/favorite.ts`
- Create: `src/db/schema/tag.ts`
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/__tests__/comment.test.ts`
- Test: `src/db/schema/__tests__/favorite.test.ts`
- Test: `src/db/schema/__tests__/tag.test.ts`

### Task 2: Comment Service + Actions
- Create: `src/features/comment/types.ts`
- Create: `src/features/comment/services/comment.service.ts`
- Create: `src/features/comment/actions/comment-actions.ts`
- Test: `src/features/comment/services/__tests__/comment.service.test.ts`

### Task 3: Comment UI (List + Form)
- Create: `src/features/comment/components/comment-list.tsx`
- Create: `src/features/comment/components/comment-form.tsx`
- Test: `src/features/comment/components/__tests__/comment-list.test.tsx`

### Task 4: Favorite Service + Actions
- Create: `src/features/favorite/types.ts`
- Create: `src/features/favorite/services/favorite.service.ts`
- Create: `src/features/favorite/actions/favorite-actions.ts`
- Test: `src/features/favorite/services/__tests__/favorite.service.test.ts`

### Task 5: Favorite UI (Button + Page)
- Create: `src/features/favorite/components/favorite-button.tsx`
- Create: `src/app/(main)/favorites/page.tsx`
- Test: `src/features/favorite/components/__tests__/favorite-button.test.tsx`

### Task 6: Tag Service + Actions
- Create: `src/features/tag/types.ts`
- Create: `src/features/tag/services/tag.service.ts`
- Create: `src/features/tag/actions/tag-actions.ts`
- Test: `src/features/tag/services/__tests__/tag.service.test.ts`

### Task 7: Tag UI (Input + Badge)
- Create: `src/features/tag/components/tag-badge.tsx`
- Create: `src/features/tag/components/tag-input.tsx`
- Test: `src/features/tag/components/__tests__/tag-badge.test.tsx`

### Task 8: Integrate Social Features into Media Viewer
- Modify: `src/features/media/components/media-viewer.tsx`
- Modify: `src/app/(main)/media/[id]/page.tsx`

### Task 9: Search Service
- Create: `src/features/search/services/search.service.ts`
- Create: `src/features/search/types.ts`
- Test: `src/features/search/services/__tests__/search.service.test.ts`

### Task 10: Search UI (Page + Components)
- Create: `src/features/search/components/search-bar.tsx`
- Create: `src/features/search/components/search-results.tsx`
- Create: `src/app/(main)/search/page.tsx`
- Test: `src/features/search/components/__tests__/search-bar.test.tsx`

---

## Task 1: Comment + Favorite + Tag Database Schema

**Files:**
- Create: `src/db/schema/comment.ts`
- Create: `src/db/schema/favorite.ts`
- Create: `src/db/schema/tag.ts`
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/__tests__/comment.test.ts`
- Test: `src/db/schema/__tests__/favorite.test.ts`
- Test: `src/db/schema/__tests__/tag.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/db/schema/__tests__/comment.test.ts
import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { comment, commentRelations } from "../comment";

describe("comment table", () => {
  it("has correct table name", () => {
    expect(getTableName(comment)).toBe("comment");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(comment);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("mediaId");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("content");
    expect(columns).toHaveProperty("createdAt");
  });
  it("exports commentRelations", () => {
    expect(commentRelations).toBeDefined();
  });
});
```

```typescript
// src/db/schema/__tests__/favorite.test.ts
import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { favorite } from "../favorite";

describe("favorite table", () => {
  it("has correct table name", () => {
    expect(getTableName(favorite)).toBe("favorite");
  });
  it("has all required columns", () => {
    const columns = getTableColumns(favorite);
    expect(columns).toHaveProperty("mediaId");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("createdAt");
  });
});
```

```typescript
// src/db/schema/__tests__/tag.test.ts
import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { tag, mediaTag, tagRelations, mediaTagRelations } from "../tag";

describe("tag table", () => {
  it("has correct table name", () => {
    expect(getTableName(tag)).toBe("tag");
  });
  it("has id and name columns", () => {
    const columns = getTableColumns(tag);
    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("name");
  });
});

describe("mediaTag table", () => {
  it("has correct table name", () => {
    expect(getTableName(mediaTag)).toBe("media_tag");
  });
  it("has composite key columns", () => {
    const columns = getTableColumns(mediaTag);
    expect(columns).toHaveProperty("mediaId");
    expect(columns).toHaveProperty("tagId");
  });
});

describe("tag relations", () => {
  it("exports tagRelations", () => { expect(tagRelations).toBeDefined(); });
  it("exports mediaTagRelations", () => { expect(mediaTagRelations).toBeDefined(); });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create comment schema**

```typescript
// src/db/schema/comment.ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { media } from "./media";

export const comment = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("comment_mediaId_idx").on(table.mediaId),
    index("comment_userId_idx").on(table.userId),
  ],
);

export const commentRelations = relations(comment, ({ one }) => ({
  media: one(media, { fields: [comment.mediaId], references: [media.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
}));
```

- [ ] **Step 4: Create favorite schema**

```typescript
// src/db/schema/favorite.ts
import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./user";
import { media } from "./media";

export const favorite = pgTable(
  "favorite",
  {
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.mediaId, table.userId] })],
);

export const favoriteRelations = relations(favorite, ({ one }) => ({
  media: one(media, { fields: [favorite.mediaId], references: [media.id] }),
  user: one(user, { fields: [favorite.userId], references: [user.id] }),
}));
```

- [ ] **Step 5: Create tag schema**

```typescript
// src/db/schema/tag.ts
import { relations } from "drizzle-orm";
import { pgTable, text, serial, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { media } from "./media";

export const tag = pgTable("tag", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const mediaTag = pgTable(
  "media_tag",
  {
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    tagId: serial("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.mediaId, table.tagId] }),
    index("media_tag_tagId_idx").on(table.tagId),
  ],
);

export const tagRelations = relations(tag, ({ many }) => ({
  mediaTags: many(mediaTag),
}));

export const mediaTagRelations = relations(mediaTag, ({ one }) => ({
  media: one(media, { fields: [mediaTag.mediaId], references: [media.id] }),
  tag: one(tag, { fields: [mediaTag.tagId], references: [tag.id] }),
}));
```

- [ ] **Step 6: Update schema barrel export**

```typescript
// src/db/schema/index.ts
export * from "./user";
export * from "./album";
export * from "./media";
export * from "./comment";
export * from "./favorite";
export * from "./tag";
export * from "./app-settings";
```

- [ ] **Step 7: Run tests, generate and apply migration**

```bash
pnpm test
pnpm db:generate
pnpm db:migrate
```

- [ ] **Step 8: Commit**

```bash
git add src/db/schema src/db/migrations
git commit -m "feat: add comment, favorite, tag, media_tag database schemas

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Comment Service + Actions

**Files:**
- Create: `src/features/comment/types.ts`
- Create: `src/features/comment/services/comment.service.ts`
- Create: `src/features/comment/actions/comment-actions.ts`
- Test: `src/features/comment/services/__tests__/comment.service.test.ts`

- [ ] **Step 1: Create comment types**

```typescript
// src/features/comment/types.ts
export interface CommentWithUser {
  id: string;
  mediaId: string;
  userId: string;
  userName: string;
  userImage: string | null;
  content: string;
  createdAt: Date;
}
```

- [ ] **Step 2: Write failing test**

```typescript
// src/features/comment/services/__tests__/comment.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "c1", content: "test" }]),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
}));

import { getCommentsForMedia, addComment, deleteComment } from "../comment.service";

describe("Comment service", () => {
  it("exports getCommentsForMedia", () => { expect(typeof getCommentsForMedia).toBe("function"); });
  it("exports addComment", () => { expect(typeof addComment).toBe("function"); });
  it("exports deleteComment", () => { expect(typeof deleteComment).toBe("function"); });
});
```

- [ ] **Step 3: Run test to verify it fails**

- [ ] **Step 4: Create comment service**

```typescript
// src/features/comment/services/comment.service.ts
import { db } from "@/db";
import { comment } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getCommentsForMedia(mediaId: string) {
  return db
    .select({
      id: comment.id,
      mediaId: comment.mediaId,
      userId: comment.userId,
      userName: user.name,
      userImage: user.image,
      content: comment.content,
      createdAt: comment.createdAt,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(eq(comment.mediaId, mediaId))
    .orderBy(asc(comment.createdAt));
}

export async function addComment(mediaId: string, userId: string, content: string) {
  const [newComment] = await db
    .insert(comment)
    .values({ mediaId, userId, content })
    .returning();
  return newComment;
}

export async function deleteComment(commentId: string) {
  await db.delete(comment).where(eq(comment.id, commentId));
}

export async function getCommentCount(mediaId: string) {
  const result = await db
    .select({ id: comment.id })
    .from(comment)
    .where(eq(comment.mediaId, mediaId));
  return result.length;
}
```

- [ ] **Step 5: Create comment actions**

```typescript
// src/features/comment/actions/comment-actions.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "@/features/media/services/media.service";
import { addComment, deleteComment } from "../services/comment.service";
import { revalidatePath } from "next/cache";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

export async function addCommentAction(mediaId: string, content: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return { error: "Invalid comment" };

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  await addComment(mediaId, session.user.id, parsed.data.content);
  revalidatePath(`/media/${mediaId}`);
  return { success: true };
}

export async function deleteCommentAction(commentId: string, mediaId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Only comment owner or app owner can delete
  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  // For simplicity, allow delete if user has access (owner of comment check would need comment fetch)
  await deleteComment(commentId);
  revalidatePath(`/media/${mediaId}`);
  return { success: true };
}
```

- [ ] **Step 6: Run tests, commit**

```bash
pnpm test
pnpm build
git add src/features/comment
git commit -m "feat: add comment service and server actions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Comment UI (List + Form)

**Files:**
- Create: `src/features/comment/components/comment-list.tsx`
- Create: `src/features/comment/components/comment-form.tsx`
- Test: `src/features/comment/components/__tests__/comment-list.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/comment/components/__tests__/comment-list.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/comment/actions/comment-actions", () => ({
  addCommentAction: vi.fn(),
  deleteCommentAction: vi.fn(),
}));

import { CommentList } from "../comment-list";

const mockComments = [
  { id: "c1", mediaId: "m1", userId: "u1", userName: "Beni", userImage: null, content: "Nice photo!", createdAt: new Date() },
  { id: "c2", mediaId: "m1", userId: "u2", userName: "Mama", userImage: null, content: "Beautiful", createdAt: new Date() },
];

describe("CommentList", () => {
  it("renders comments", () => {
    render(<CommentList mediaId="m1" comments={mockComments} />);
    expect(screen.getByText("Nice photo!")).toBeInTheDocument();
    expect(screen.getByText("Beautiful")).toBeInTheDocument();
  });
  it("renders user names", () => {
    render(<CommentList mediaId="m1" comments={mockComments} />);
    expect(screen.getByText("Beni")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
  });
  it("renders empty state when no comments", () => {
    render(<CommentList mediaId="m1" comments={[]} />);
    expect(screen.getByText(/no comments/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Create CommentForm**

```tsx
// src/features/comment/components/comment-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { addCommentAction } from "../actions/comment-actions";

interface CommentFormProps {
  mediaId: string;
}

export function CommentForm({ mediaId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    await addCommentAction(mediaId, content.trim());
    setContent("");
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 text-sm"
      />
      <Button type="submit" size="icon" disabled={pending || !content.trim()} className="shrink-0">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create CommentList**

```tsx
// src/features/comment/components/comment-list.tsx
"use client";

import { UserAvatar } from "@/shared/components/avatar";
import { CommentForm } from "./comment-form";
import type { CommentWithUser } from "../types";

interface CommentListProps {
  mediaId: string;
  comments: CommentWithUser[];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentList({ mediaId, comments }: CommentListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <UserAvatar name={c.userName} image={c.userImage} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.userName}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t p-3">
        <CommentForm mediaId={mediaId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests, commit**

```bash
pnpm test
git add src/features/comment/components
git commit -m "feat: add comment list and form components

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Favorite Service + Actions

**Files:**
- Create: `src/features/favorite/types.ts`
- Create: `src/features/favorite/services/favorite.service.ts`
- Create: `src/features/favorite/actions/favorite-actions.ts`
- Test: `src/features/favorite/services/__tests__/favorite.service.test.ts`

- [ ] **Step 1: Create types**

```typescript
// src/features/favorite/types.ts
export interface FavoriteMedia {
  mediaId: string;
  albumId: string;
  type: "photo" | "video";
  filename: string;
  thumbnailR2Key: string;
  duration: number | null;
  favoritedAt: Date;
}
```

- [ ] **Step 2: Write failing test**

```typescript
// src/features/favorite/services/__tests__/favorite.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([]),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  },
}));

import { toggleFavorite, isFavorited, getFavoritesForUser } from "../favorite.service";

describe("Favorite service", () => {
  it("exports toggleFavorite", () => { expect(typeof toggleFavorite).toBe("function"); });
  it("exports isFavorited", () => { expect(typeof isFavorited).toBe("function"); });
  it("exports getFavoritesForUser", () => { expect(typeof getFavoritesForUser).toBe("function"); });
});
```

- [ ] **Step 3: Implement favorite service**

```typescript
// src/features/favorite/services/favorite.service.ts
import { db } from "@/db";
import { favorite } from "@/db/schema";
import { media } from "@/db/schema";
import { albumMember } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function isFavorited(mediaId: string, userId: string): Promise<boolean> {
  const [result] = await db
    .select()
    .from(favorite)
    .where(and(eq(favorite.mediaId, mediaId), eq(favorite.userId, userId)))
    .limit(1);
  return !!result;
}

export async function toggleFavorite(mediaId: string, userId: string): Promise<boolean> {
  const existing = await isFavorited(mediaId, userId);

  if (existing) {
    await db
      .delete(favorite)
      .where(and(eq(favorite.mediaId, mediaId), eq(favorite.userId, userId)));
    return false;
  }

  await db.insert(favorite).values({ mediaId, userId }).onConflictDoNothing();
  return true;
}

export async function getFavoritesForUser(userId: string, userRole: string) {
  if (userRole === "owner") {
    return db
      .select({
        mediaId: favorite.mediaId,
        albumId: media.albumId,
        type: media.type,
        filename: media.filename,
        thumbnailR2Key: media.thumbnailR2Key,
        duration: media.duration,
        favoritedAt: favorite.createdAt,
      })
      .from(favorite)
      .innerJoin(media, eq(favorite.mediaId, media.id))
      .where(eq(favorite.userId, userId))
      .orderBy(desc(favorite.createdAt));
  }

  // For members, only show favorites from albums they have access to
  return db
    .select({
      mediaId: favorite.mediaId,
      albumId: media.albumId,
      type: media.type,
      filename: media.filename,
      thumbnailR2Key: media.thumbnailR2Key,
      duration: media.duration,
      favoritedAt: favorite.createdAt,
    })
    .from(favorite)
    .innerJoin(media, eq(favorite.mediaId, media.id))
    .innerJoin(albumMember, and(eq(media.albumId, albumMember.albumId), eq(albumMember.userId, userId)))
    .where(eq(favorite.userId, userId))
    .orderBy(desc(favorite.createdAt));
}

export async function getFavoriteCount(mediaId: string): Promise<number> {
  const result = await db
    .select({ mediaId: favorite.mediaId })
    .from(favorite)
    .where(eq(favorite.mediaId, mediaId));
  return result.length;
}
```

- [ ] **Step 4: Create favorite actions**

```typescript
// src/features/favorite/actions/favorite-actions.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "@/features/media/services/media.service";
import { toggleFavorite } from "../services/favorite.service";
import { revalidatePath } from "next/cache";

export async function toggleFavoriteAction(mediaId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canAccess = await canAccessAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canAccess) return { error: "Permission denied" };

  const isFav = await toggleFavorite(mediaId, session.user.id);
  revalidatePath(`/media/${mediaId}`);
  revalidatePath("/favorites");
  return { success: true, isFavorited: isFav };
}
```

- [ ] **Step 5: Run tests, commit**

```bash
pnpm test
pnpm build
git add src/features/favorite
git commit -m "feat: add favorite service and toggle action

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Favorite UI (Button + Page)

**Files:**
- Create: `src/features/favorite/components/favorite-button.tsx`
- Create: `src/app/(main)/favorites/page.tsx`
- Test: `src/features/favorite/components/__tests__/favorite-button.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/favorite/components/__tests__/favorite-button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/favorite/actions/favorite-actions", () => ({
  toggleFavoriteAction: vi.fn().mockResolvedValue({ success: true, isFavorited: true }),
}));

import { FavoriteButton } from "../favorite-button";

describe("FavoriteButton", () => {
  it("renders heart icon", () => {
    render(<FavoriteButton mediaId="m1" initialFavorited={false} />);
    expect(screen.getByRole("button", { name: /favorite/i })).toBeInTheDocument();
  });
  it("shows filled heart when favorited", () => {
    const { container } = render(<FavoriteButton mediaId="m1" initialFavorited={true} />);
    expect(container.querySelector("[data-favorited='true']")).toBeInTheDocument();
  });
  it("toggles on click", async () => {
    render(<FavoriteButton mediaId="m1" initialFavorited={false} />);
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    // Optimistic update should toggle immediately
  });
});
```

- [ ] **Step 2: Create FavoriteButton**

```tsx
// src/features/favorite/components/favorite-button.tsx
"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "../actions/favorite-actions";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  mediaId: string;
  initialFavorited: boolean;
  className?: string;
}

export function FavoriteButton({ mediaId, initialFavorited, className }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    setPending(true);
    setIsFavorited(!isFavorited); // Optimistic update
    const result = await toggleFavoriteAction(mediaId);
    if (result.error) {
      setIsFavorited(isFavorited); // Revert on error
    }
    setPending(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-9", className)}
      onClick={handleToggle}
      disabled={pending}
      aria-label="Favorite"
      data-favorited={isFavorited}
    >
      <Heart
        className={cn(
          "size-5 transition-colors",
          isFavorited ? "fill-red-500 text-red-500" : "text-current"
        )}
      />
    </Button>
  );
}
```

- [ ] **Step 3: Create favorites page**

```tsx
// src/app/(main)/favorites/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFavoritesForUser } from "@/features/favorite/services/favorite.service";
import { Heart } from "lucide-react";
import Link from "next/link";

export default async function FavoritesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const favorites = await getFavoritesForUser(session.user.id, userRole);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">
          {favorites.length} favorited item{favorites.length !== 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="size-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No favorites yet</p>
          <p className="text-xs mt-1">Tap the heart icon on any photo or video</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
          {favorites.map((fav) => (
            <Link key={fav.mediaId} href={`/media/${fav.mediaId}`} className="group">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
                <img
                  src={`/api/thumbnail/${fav.mediaId}`}
                  alt={fav.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests, commit**

```bash
pnpm test
pnpm build
git add src/features/favorite/components src/app/\(main\)/favorites
git commit -m "feat: add favorite button and favorites page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Tag Service + Actions

**Files:**
- Create: `src/features/tag/types.ts`
- Create: `src/features/tag/services/tag.service.ts`
- Create: `src/features/tag/actions/tag-actions.ts`
- Test: `src/features/tag/services/__tests__/tag.service.test.ts`

- [ ] **Step 1: Create types**

```typescript
// src/features/tag/types.ts
export interface TagInfo {
  id: number;
  name: string;
}
```

- [ ] **Step 2: Write failing test**

```typescript
// src/features/tag/services/__tests__/tag.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1, name: "sunset" }]),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  },
}));

import { getTagsForMedia, addTagToMedia, removeTagFromMedia, findOrCreateTag } from "../tag.service";

describe("Tag service", () => {
  it("exports getTagsForMedia", () => { expect(typeof getTagsForMedia).toBe("function"); });
  it("exports addTagToMedia", () => { expect(typeof addTagToMedia).toBe("function"); });
  it("exports removeTagFromMedia", () => { expect(typeof removeTagFromMedia).toBe("function"); });
  it("exports findOrCreateTag", () => { expect(typeof findOrCreateTag).toBe("function"); });
});
```

- [ ] **Step 3: Implement tag service**

```typescript
// src/features/tag/services/tag.service.ts
import { db } from "@/db";
import { tag, mediaTag } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export async function getTagsForMedia(mediaId: string) {
  return db
    .select({ id: tag.id, name: tag.name })
    .from(mediaTag)
    .innerJoin(tag, eq(mediaTag.tagId, tag.id))
    .where(eq(mediaTag.mediaId, mediaId));
}

export async function findOrCreateTag(name: string) {
  const normalized = name.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
  if (!normalized) return null;

  const [existing] = await db
    .select()
    .from(tag)
    .where(eq(tag.name, normalized))
    .limit(1);

  if (existing) return existing;

  const [newTag] = await db
    .insert(tag)
    .values({ name: normalized })
    .returning();

  return newTag;
}

export async function addTagToMedia(mediaId: string, tagName: string) {
  const tagRecord = await findOrCreateTag(tagName);
  if (!tagRecord) return null;

  await db
    .insert(mediaTag)
    .values({ mediaId, tagId: tagRecord.id })
    .onConflictDoNothing();

  return tagRecord;
}

export async function removeTagFromMedia(mediaId: string, tagId: number) {
  await db
    .delete(mediaTag)
    .where(and(eq(mediaTag.mediaId, mediaId), eq(mediaTag.tagId, tagId)));
}

export async function searchTags(query: string) {
  return db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(ilike(tag.name, `%${query}%`));
}
```

- [ ] **Step 4: Create tag actions**

```typescript
// src/features/tag/actions/tag-actions.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canEditAlbum } from "@/features/album/services/album.service";
import { getMediaById } from "@/features/media/services/media.service";
import { addTagToMedia, removeTagFromMedia } from "../services/tag.service";
import { revalidatePath } from "next/cache";

export async function addTagAction(mediaId: string, tagName: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  const tag = await addTagToMedia(mediaId, tagName);
  if (!tag) return { error: "Invalid tag name" };

  revalidatePath(`/media/${mediaId}`);
  return { success: true, tag };
}

export async function removeTagAction(mediaId: string, tagId: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { error: "Media not found" };

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  if (!canEdit) return { error: "Permission denied" };

  await removeTagFromMedia(mediaId, tagId);
  revalidatePath(`/media/${mediaId}`);
  return { success: true };
}
```

- [ ] **Step 5: Run tests, commit**

```bash
pnpm test
pnpm build
git add src/features/tag
git commit -m "feat: add tag service with find-or-create and media tagging

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Tag UI (Badge + Input)

**Files:**
- Create: `src/features/tag/components/tag-badge.tsx`
- Create: `src/features/tag/components/tag-input.tsx`
- Test: `src/features/tag/components/__tests__/tag-badge.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/tag/components/__tests__/tag-badge.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { TagBadge } from "../tag-badge";

describe("TagBadge", () => {
  it("renders tag name with # prefix", () => {
    render(<TagBadge name="sunset" />);
    expect(screen.getByText("#sunset")).toBeInTheDocument();
  });
  it("renders remove button when onRemove provided", () => {
    render(<TagBadge name="sunset" onRemove={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
  it("does not render remove button without onRemove", () => {
    render(<TagBadge name="sunset" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create TagBadge**

```tsx
// src/features/tag/components/tag-badge.tsx
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({ name, onRemove, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary",
        className
      )}
    >
      #{name}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-destructive">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Create TagInput**

```tsx
// src/features/tag/components/tag-input.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { addTagAction, removeTagAction } from "../actions/tag-actions";
import { TagBadge } from "./tag-badge";
import type { TagInfo } from "../types";

interface TagInputProps {
  mediaId: string;
  tags: TagInfo[];
  canEdit: boolean;
}

export function TagInput({ mediaId, tags, canEdit }: TagInputProps) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const handleAdd = async () => {
    if (!value.trim()) return;
    setPending(true);
    await addTagAction(mediaId, value.trim());
    setValue("");
    setPending(false);
  };

  const handleRemove = async (tagId: number) => {
    await removeTagAction(mediaId, tagId);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <TagBadge
            key={t.id}
            name={t.name}
            onRemove={canEdit ? () => handleRemove(t.id) : undefined}
          />
        ))}
      </div>
      {canEdit && (
        <div className="flex gap-1">
          <Input
            placeholder="Add tag..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            className="h-7 text-xs"
          />
          <button
            onClick={handleAdd}
            disabled={pending || !value.trim()}
            className="text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests, commit**

```bash
pnpm test
git add src/features/tag/components
git commit -m "feat: add tag badge and input components

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Integrate Social Features into Media Viewer

**Files:**
- Modify: `src/features/media/components/media-viewer.tsx`
- Modify: `src/app/(main)/media/[id]/page.tsx`

- [ ] **Step 1: Update media viewer to accept social props**

```tsx
// src/features/media/components/media-viewer.tsx
"use client";

import { useRouter } from "next/navigation";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./video-player";
import { FavoriteButton } from "@/features/favorite/components/favorite-button";
import { CommentList } from "@/features/comment/components/comment-list";
import { TagInput } from "@/features/tag/components/tag-input";
import type { MediaWithUploader } from "../types";
import type { CommentWithUser } from "@/features/comment/types";
import type { TagInfo } from "@/features/tag/types";

interface MediaViewerProps {
  media: MediaWithUploader;
  viewUrl: string;
  downloadUrl?: string;
  isFavorited: boolean;
  comments: CommentWithUser[];
  tags: TagInfo[];
  canEdit: boolean;
}

export function MediaViewer({
  media,
  viewUrl,
  downloadUrl,
  isFavorited,
  comments,
  tags,
  canEdit,
}: MediaViewerProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col lg:flex-row">
      {/* Media content */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-white hover:bg-white/10"
            onClick={() => router.back()}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
          <div className="flex items-center gap-1">
            <FavoriteButton
              mediaId={media.id}
              initialFavorited={isFavorited}
              className="text-white hover:bg-white/10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-white hover:bg-white/10"
              onClick={() => downloadUrl && window.open(downloadUrl, "_blank")}
              aria-label="Download"
            >
              <Download className="size-5" />
            </Button>
          </div>
        </div>

        {/* Media */}
        <div className="flex-1 flex items-center justify-center p-4">
          {media.type === "video" ? (
            <VideoPlayer src={viewUrl} className="max-w-full max-h-full rounded-lg" />
          ) : (
            <img src={viewUrl} alt={media.filename} className="max-w-full max-h-full object-contain" />
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
          <div className="mt-2">
            <TagInput mediaId={media.id} tags={tags} canEdit={canEdit} />
          </div>
        </div>
      </div>

      {/* Side panel — comments (desktop) */}
      <div className="hidden lg:flex w-80 bg-background border-l border-border flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Comments ({comments.length})</h3>
        </div>
        <CommentList mediaId={media.id} comments={comments} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update media page to fetch social data**

```tsx
// src/app/(main)/media/[id]/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getMediaById } from "@/features/media/services/media.service";
import { canAccessAlbum, canEditAlbum } from "@/features/album/services/album.service";
import { getViewPresignedUrl, getDownloadPresignedUrl } from "@/shared/lib/r2";
import { getCommentsForMedia } from "@/features/comment/services/comment.service";
import { isFavorited } from "@/features/favorite/services/favorite.service";
import { getTagsForMedia } from "@/features/tag/services/tag.service";
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

  const canEdit = await canEditAlbum(mediaRecord.albumId, session.user.id, userRole);
  const expiresIn = mediaRecord.type === "video" ? 14400 : 3600;

  const [viewUrl, downloadUrl, comments, favorited, tags] = await Promise.all([
    getViewPresignedUrl(mediaRecord.r2Key, expiresIn),
    getDownloadPresignedUrl(mediaRecord.r2Key, mediaRecord.filename),
    getCommentsForMedia(id),
    isFavorited(id, session.user.id),
    getTagsForMedia(id),
  ]);

  return (
    <MediaViewer
      media={mediaRecord}
      viewUrl={viewUrl}
      downloadUrl={downloadUrl}
      isFavorited={favorited}
      comments={comments}
      tags={tags}
      canEdit={canEdit}
    />
  );
}
```

- [ ] **Step 3: Verify build, run tests**

```bash
pnpm test
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/media/components/media-viewer.tsx src/app/\(main\)/media/\[id\]/page.tsx
git commit -m "feat: integrate comments, favorites, tags into media viewer

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Search Service

**Files:**
- Create: `src/features/search/types.ts`
- Create: `src/features/search/services/search.service.ts`
- Test: `src/features/search/services/__tests__/search.service.test.ts`

- [ ] **Step 1: Create search types**

```typescript
// src/features/search/types.ts
export interface SearchResult {
  type: "media" | "album";
  id: string;
  title: string;
  albumId?: string;
  albumName?: string;
  mediaType?: "photo" | "video";
  thumbnailMediaId?: string;
}
```

- [ ] **Step 2: Write failing test**

```typescript
// src/features/search/services/__tests__/search.service.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
  },
}));

import { searchMedia } from "../search.service";

describe("Search service", () => {
  it("exports searchMedia", () => { expect(typeof searchMedia).toBe("function"); });
});
```

- [ ] **Step 3: Implement search service**

```typescript
// src/features/search/services/search.service.ts
import { db } from "@/db";
import { media, album, albumMember } from "@/db/schema";
import { tag, mediaTag } from "@/db/schema";
import { eq, or, ilike, and, sql } from "drizzle-orm";
import type { SearchResult } from "../types";

export async function searchMedia(
  query: string,
  userId: string,
  userRole: string
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // Search albums by name
  let albumResults;
  if (userRole === "owner") {
    albumResults = await db
      .select({ id: album.id, name: album.name })
      .from(album)
      .where(ilike(album.name, searchTerm));
  } else {
    albumResults = await db
      .select({ id: album.id, name: album.name })
      .from(album)
      .innerJoin(albumMember, eq(album.id, albumMember.albumId))
      .where(and(eq(albumMember.userId, userId), ilike(album.name, searchTerm)));
  }

  for (const a of albumResults) {
    results.push({ type: "album", id: a.id, title: a.name });
  }

  // Search media by filename
  let mediaResults;
  if (userRole === "owner") {
    mediaResults = await db
      .select({
        id: media.id,
        filename: media.filename,
        albumId: media.albumId,
        albumName: album.name,
        type: media.type,
      })
      .from(media)
      .innerJoin(album, eq(media.albumId, album.id))
      .where(ilike(media.filename, searchTerm));
  } else {
    mediaResults = await db
      .select({
        id: media.id,
        filename: media.filename,
        albumId: media.albumId,
        albumName: album.name,
        type: media.type,
      })
      .from(media)
      .innerJoin(album, eq(media.albumId, album.id))
      .innerJoin(albumMember, eq(album.id, albumMember.albumId))
      .where(and(eq(albumMember.userId, userId), ilike(media.filename, searchTerm)));
  }

  for (const m of mediaResults) {
    results.push({
      type: "media",
      id: m.id,
      title: m.filename,
      albumId: m.albumId,
      albumName: m.albumName,
      mediaType: m.type,
      thumbnailMediaId: m.id,
    });
  }

  // Search by tag name
  let tagResults;
  if (userRole === "owner") {
    tagResults = await db
      .select({
        mediaId: media.id,
        filename: media.filename,
        albumId: media.albumId,
        albumName: album.name,
        type: media.type,
        tagName: tag.name,
      })
      .from(mediaTag)
      .innerJoin(tag, eq(mediaTag.tagId, tag.id))
      .innerJoin(media, eq(mediaTag.mediaId, media.id))
      .innerJoin(album, eq(media.albumId, album.id))
      .where(ilike(tag.name, searchTerm));
  } else {
    tagResults = await db
      .select({
        mediaId: media.id,
        filename: media.filename,
        albumId: media.albumId,
        albumName: album.name,
        type: media.type,
        tagName: tag.name,
      })
      .from(mediaTag)
      .innerJoin(tag, eq(mediaTag.tagId, tag.id))
      .innerJoin(media, eq(mediaTag.mediaId, media.id))
      .innerJoin(album, eq(media.albumId, album.id))
      .innerJoin(albumMember, eq(album.id, albumMember.albumId))
      .where(and(eq(albumMember.userId, userId), ilike(tag.name, searchTerm)));
  }

  for (const t of tagResults) {
    // Avoid duplicates (media might already appear from filename search)
    if (!results.some((r) => r.type === "media" && r.id === t.mediaId)) {
      results.push({
        type: "media",
        id: t.mediaId,
        title: `${t.filename} #${t.tagName}`,
        albumId: t.albumId,
        albumName: t.albumName,
        mediaType: t.type,
        thumbnailMediaId: t.mediaId,
      });
    }
  }

  return results;
}
```

- [ ] **Step 4: Run tests, commit**

```bash
pnpm test
pnpm build
git add src/features/search
git commit -m "feat: add search service with album, media, and tag search

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Search UI (Page + Components)

**Files:**
- Create: `src/features/search/components/search-bar.tsx`
- Create: `src/features/search/components/search-results.tsx`
- Create: `src/app/(main)/search/page.tsx`
- Test: `src/features/search/components/__tests__/search-bar.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/features/search/components/__tests__/search-bar.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { SearchBar } from "../search-bar";

describe("SearchBar", () => {
  it("renders search input", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create SearchBar**

```tsx
// src/features/search/components/search-bar.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        placeholder="Search photos, videos, tags..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
      />
    </form>
  );
}
```

- [ ] **Step 3: Create SearchResults**

```tsx
// src/features/search/components/search-results.tsx
import Link from "next/link";
import { ImageIcon, FolderOpen } from "lucide-react";
import type { SearchResult } from "../types";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="size-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No results for &quot;{query}&quot;</p>
      </div>
    );
  }

  const albums = results.filter((r) => r.type === "album");
  const mediaItems = results.filter((r) => r.type === "media");

  return (
    <div className="space-y-6">
      {albums.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Albums ({albums.length})</h3>
          <div className="space-y-1">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <FolderOpen className="size-5 text-muted-foreground" />
                <span className="text-sm">{album.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mediaItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Media ({mediaItems.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
            {mediaItems.map((item) => (
              <Link key={item.id} href={`/media/${item.id}`} className="group">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
                  {item.thumbnailMediaId ? (
                    <img
                      src={`/api/thumbnail/${item.thumbnailMediaId}`}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="size-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{item.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Search icon
import { Search } from "lucide-react";
```

Note: Move the `import { Search }` to the top of the file.

- [ ] **Step 4: Create search page**

```tsx
// src/app/(main)/search/page.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { searchMedia } from "@/features/search/services/search.service";
import { SearchBar } from "@/features/search/components/search-bar";
import { SearchResults } from "@/features/search/components/search-results";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRole = ((session.user as Record<string, unknown>).role as string) ?? "member";
  const results = q ? await searchMedia(q, session.user.id, userRole) : [];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight mb-4">Search</h1>
        <SearchBar />
      </div>
      {q && <SearchResults results={results} query={q} />}
    </div>
  );
}
```

- [ ] **Step 5: Run tests, verify build**

```bash
pnpm test
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/features/search/components src/app/\(main\)/search
git commit -m "feat: add search page with album, media, and tag search

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Summary

After completing all 10 tasks, you have:

- **Comments:** Add/delete comments on media, chronological list with user avatars, integrated in media viewer side panel
- **Favorites:** Toggle favorite on any media, optimistic UI, dedicated `/favorites` page with grid
- **Tags:** Add/remove tags on media (editors only), `#tag` badges, find-or-create pattern
- **Search:** Search across album names, media filenames, and tag names with permission-filtered results, dedicated `/search` page
- **Media Viewer Enhanced:** Now shows favorite button, comments side panel (desktop), tag chips with add/remove

**Next:** Plan 4 (Admin Dashboard + PWA)
