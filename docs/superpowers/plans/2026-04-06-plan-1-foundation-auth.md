# Plan 1: Foundation + Auth + Design System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the project foundation with Next.js, database, authentication, design system, and app shell — producing a working app with login, register, setup wizard, and themed layout.

**Architecture:** Next.js 15 App Router full-stack. Drizzle ORM with Neon PostgreSQL serverless driver. Better Auth for session-based authentication with Argon2id. Tailwind CSS v4 + shadcn/ui for UI. Feature-based folder structure with SOLID principles.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Better Auth, Zod, next-themes, pnpm

**Spec reference:** `docs/superpowers/specs/2026-04-06-galeriku-design.md`

---

## File Map

### Task 1: Project Scaffolding
- Create: `package.json` (via create-next-app)
- Create: `next.config.ts`
- Create: `.env.local`
- Create: `.gitignore`

### Task 2: Database Schema + Client
- Create: `src/db/schema/user.ts`
- Create: `src/db/schema/app-settings.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`

### Task 3: Better Auth Setup
- Create: `src/features/auth/lib/auth.ts`
- Create: `src/features/auth/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

### Task 4: Design System + Theme
- Create: `src/app/globals.css`
- Create: `src/shared/components/theme-provider.tsx`
- Create: `src/shared/components/theme-toggle.tsx`
- Create: `src/app/layout.tsx`

### Task 5: Shared Layout Components
- Create: `src/shared/components/bottom-nav.tsx`
- Create: `src/shared/components/top-nav.tsx`
- Create: `src/shared/components/app-shell.tsx`
- Create: `src/shared/components/avatar.tsx`

### Task 6: CSP Nonce (proxy.ts) + Auth Middleware
- Create: `proxy.ts` (CSP nonce, security headers)
- Create: `src/middleware.ts` (auth guard only)

### Task 7: Setup Wizard
- Create: `src/features/auth/components/setup-form.tsx`
- Create: `src/features/auth/actions/setup.ts`
- Create: `src/app/(auth)/setup/page.tsx`

### Task 8: Login Page
- Create: `src/features/auth/components/login-form.tsx`
- Create: `src/features/auth/actions/login.ts`
- Create: `src/app/(auth)/login/page.tsx`

### Task 9: Register Page
- Create: `src/features/auth/components/register-form.tsx`
- Create: `src/features/auth/actions/register.ts`
- Create: `src/app/(auth)/register/page.tsx`

### Task 10: Protected Home Page + Security Headers
- Create: `src/app/(main)/layout.tsx`
- Create: `src/app/(main)/albums/page.tsx`
- Modify: `next.config.ts` (add security headers)

---

## Task 1: Project Scaffolding

**Files:**
- Create: entire project via `create-next-app`
- Modify: `package.json` (add dependencies)
- Create: `.env.local`

- [ ] **Step 1: Create Next.js project**

```bash
cd /home/handokobeni/Work
pnpm create next-app@latest galeriku --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

When prompted, accept defaults. This scaffolds Next.js 15 with App Router, TypeScript, Tailwind CSS v4, ESLint, and `src/` directory.

- [ ] **Step 2: Install core dependencies**

```bash
cd /home/handokobeni/Work/galeriku
pnpm add drizzle-orm @neondatabase/serverless better-auth zod next-themes lucide-react
pnpm add -D drizzle-kit
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
```

Accept defaults (New York style, Zinc base color). This creates `components.json` and configures Tailwind integration.

- [ ] **Step 4: Add shadcn/ui components needed for auth**

```bash
pnpm dlx shadcn@latest add button input label card toast sonner
```

- [ ] **Step 5: Create `.env.local`**

```env
# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/galeriku?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=generate-a-random-32-char-string-here
BETTER_AUTH_URL=http://localhost:3000

# Cloudflare R2 (for Plan 2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=galeriku-storage
R2_PUBLIC_DOMAIN=https://your-account-id.r2.cloudflarestorage.com
```

- [ ] **Step 6: Update `.gitignore`**

Add to existing `.gitignore`:

```
.env.local
.superpowers/
```

- [ ] **Step 7: Verify dev server starts**

```bash
pnpm dev
```

Expected: Next.js dev server running at `http://localhost:3000` with no errors.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 15 project with core dependencies"
```

---

## Task 2: Database Schema + Client

**Files:**
- Create: `src/db/schema/user.ts`
- Create: `src/db/schema/app-settings.ts`
- Create: `src/db/schema/index.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create database client**

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type Database = typeof db;
```

- [ ] **Step 2: Create user schema**

```typescript
// src/db/schema/user.ts
import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "member"]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("member"),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

- [ ] **Step 3: Create app settings schema**

```typescript
// src/db/schema/app-settings.ts
import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

- [ ] **Step 4: Create schema barrel export**

```typescript
// src/db/schema/index.ts
export * from "./user";
export * from "./app-settings";
```

- [ ] **Step 5: Create Drizzle config**

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 6: Generate and run migration**

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Expected: Migration files created in `src/db/migrations/`. Tables created in Neon database.

- [ ] **Step 7: Seed default app settings**

```bash
pnpm drizzle-kit studio
```

Or run via a script — insert default settings:

```typescript
// src/db/seed.ts
import { db } from "./index";
import { appSettings } from "./schema";

async function seed() {
  await db.insert(appSettings).values([
    { key: "app_name", value: JSON.stringify("Galeriku") },
    { key: "registration_open", value: JSON.stringify(false) },
    { key: "max_upload_photo_mb", value: JSON.stringify(20) },
    { key: "max_upload_video_mb", value: JSON.stringify(500) },
    { key: "storage_warning_pct", value: JSON.stringify(80) },
  ]).onConflictDoNothing();

  console.log("Seed complete");
  process.exit(0);
}

seed();
```

Run: `pnpm tsx src/db/seed.ts`

- [ ] **Step 8: Commit**

```bash
git add src/db drizzle.config.ts
git commit -m "feat: add database schema with Drizzle ORM and Neon"
```

---

## Task 3: Better Auth Setup

**Files:**
- Create: `src/features/auth/lib/auth.ts`
- Create: `src/features/auth/lib/auth-client.ts`
- Create: `src/features/auth/types.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create auth server config**

```typescript
// src/features/auth/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 2: Create auth client**

```typescript
// src/features/auth/lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "",
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

- [ ] **Step 3: Add NEXT_PUBLIC env var**

Append to `.env.local`:

```env
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

- [ ] **Step 4: Create auth types**

```typescript
// src/features/auth/types.ts
export type UserRole = "owner" | "member";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  image: string | null;
  role: UserRole;
}
```

- [ ] **Step 5: Create API route handler**

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/features/auth/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 6: Verify auth endpoints work**

```bash
pnpm dev
# In another terminal:
curl http://localhost:3000/api/auth/ok
```

Expected: `{ "ok": true }` response.

- [ ] **Step 7: Commit**

```bash
git add src/features/auth src/app/api/auth .env.local
git commit -m "feat: configure Better Auth with Drizzle adapter"
```

---

## Task 4: Design System + Theme

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/shared/components/theme-provider.tsx`
- Create: `src/shared/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update globals.css with design tokens**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.985 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.488 0.183 264.05);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.965 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.965 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.965 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.488 0.183 264.05);
}

.dark {
  --background: oklch(0.079 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.119 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.079 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.637 0.178 265.22);
  --primary-foreground: oklch(0.079 0 0);
  --secondary: oklch(0.199 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.199 0 0);
  --muted-foreground: oklch(0.648 0 0);
  --accent: oklch(0.199 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.079 0 0);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.637 0.178 265.22);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  h1, h2, h3, h4 {
    letter-spacing: -0.025em;
  }
}
```

- [ ] **Step 2: Create theme provider**

```tsx
// src/shared/components/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  nonce?: string;
}

export function ThemeProvider({ children, nonce }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 3: Create theme toggle**

```tsx
// src/shared/components/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="size-9 rounded-xl"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

- [ ] **Step 4: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Galeriku",
  description: "Personal photo & video gallery",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} nonce={nonce}>
        <ThemeProvider nonce={nonce}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify theme works**

```bash
pnpm dev
```

Open `http://localhost:3000` — should render with light theme, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/shared
git commit -m "feat: add design system with light/dark theme support"
```

---

## Task 5: Shared Layout Components

**Files:**
- Create: `src/shared/components/avatar.tsx`
- Create: `src/shared/components/bottom-nav.tsx`
- Create: `src/shared/components/top-nav.tsx`
- Create: `src/shared/components/app-shell.tsx`

- [ ] **Step 1: Create avatar component**

```tsx
// src/shared/components/avatar.tsx
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-6 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColor(name: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-sky-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ name, image, size = "md", className }: UserAvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white",
        sizeMap[size],
        getColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
```

- [ ] **Step 2: Create bottom navigation (mobile)**

```tsx
// src/shared/components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Heart, Search, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/albums", icon: LayoutGrid, label: "Albums" },
  { href: "/favorites", icon: Heart, label: "Favorites" },
  { href: "#upload", icon: Plus, label: "Upload", isFab: true },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/admin", icon: Settings, label: "Settings" },
];

interface BottomNavProps {
  isOwner?: boolean;
}

export function BottomNav({ isOwner }: BottomNavProps) {
  const pathname = usePathname();

  const items = isOwner
    ? navItems
    : navItems.filter((item) => item.href !== "/admin");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div className="flex items-center justify-around bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] px-2 pt-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "#upload";

          if (item.isFab) {
            return (
              <button
                key={item.href}
                className="flex flex-col items-center -mt-4"
                aria-label={item.label}
              >
                <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Plus className="size-5 text-white" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 text-[10px]",
                isActive ? "text-indigo-500" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create top navigation (desktop)**

```tsx
// src/shared/components/top-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { signOut } from "@/features/auth/lib/auth-client";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/features/auth/types";

const navLinks = [
  { href: "/albums", label: "Albums" },
  { href: "/favorites", label: "Favorites" },
];

interface TopNavProps {
  user: AuthUser;
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/albums" className="text-lg font-bold tracking-tight">
          Galeriku
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {user.role === "owner" && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-52"
        >
          <Search className="size-4" />
          <span>Search...</span>
        </Link>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>
        <UserAvatar name={user.name} image={user.image} />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create app shell**

```tsx
// src/shared/components/app-shell.tsx
import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";
import type { AuthUser } from "@/features/auth/types";

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-svh flex flex-col">
      <TopNav user={user} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav isOwner={user.role === "owner"} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/shared
git commit -m "feat: add shared layout components (avatar, nav, app shell)"
```

---

## Task 6: CSP Nonce (proxy.ts) + Auth Middleware

**Files:**
- Create: `proxy.ts` (root, CSP nonce generation)
- Create: `src/middleware.ts` (auth guard)

- [ ] **Step 1: Create `proxy.ts` for CSP nonce**

This follows the official Next.js pattern — `proxy.ts` handles request/response transformation (CSP headers, nonce), separate from `middleware.ts` (auth logic).

```typescript
// proxy.ts (root of project, next to middleware.ts)
import { NextRequest, NextResponse } from "next/server";

const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN ?? "";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // strict-dynamic: allows scripts loaded by nonce'd scripts to execute
  // (needed because Next.js runtime dynamically loads JS chunks)
  // unsafe-eval: only in dev for React's enhanced debugging features
  // unsafe-inline: only in dev for style hot-reload; nonce in production
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: ${R2_DOMAIN};
    media-src 'self' blob: ${R2_DOMAIN};
    connect-src 'self' ${R2_DOMAIN};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  return response;
}
```

- [ ] **Step 2: Create `middleware.ts` for auth guard only**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/features/auth/lib/auth";

const publicPaths = ["/login", "/register", "/setup", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check session via Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // No session → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes → owner only
  if (pathname.startsWith("/admin") && (session.user as Record<string, unknown>).role !== "owner") {
    return NextResponse.redirect(new URL("/albums", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
```


export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
```

- [ ] **Step 2: Verify middleware blocks unauthenticated access**

```bash
pnpm dev
# Visit http://localhost:3000/albums in browser
```

Expected: Redirected to `/login` (which will 404 for now — that's fine, we build it next).

- [ ] **Step 3: Verify nonce is applied**

```bash
pnpm dev
# In another terminal:
curl -I http://localhost:3000/login
```

Expected: `Content-Security-Policy` header contains `'nonce-...'` value with `'strict-dynamic'`. In production: no `'unsafe-inline'` or `'unsafe-eval'`.

- [ ] **Step 4: Verify auth middleware blocks unauthenticated access**

```bash
# Visit http://localhost:3000/albums in browser
```

Expected: Redirected to `/login` (which will 404 for now — that's fine, we build it next).

- [ ] **Step 5: Commit**

```bash
git add proxy.ts src/middleware.ts
git commit -m "feat: add proxy.ts with nonce-based CSP and auth middleware"
```

---

## Task 7: Setup Wizard

**Files:**
- Create: `src/features/auth/actions/setup.ts`
- Create: `src/features/auth/components/setup-form.tsx`
- Create: `src/app/(auth)/setup/page.tsx`
- Create: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Create auth layout (centered card)**

```tsx
// src/app/(auth)/layout.tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create setup action**

```typescript
// src/features/auth/actions/setup.ts
"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { appSettings } from "@/db/schema";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, count } from "drizzle-orm";

const setupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SetupState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function setupOwner(_prev: SetupState, formData: FormData): Promise<SetupState> {
  // Check if owner already exists
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count > 0) {
    redirect("/login");
  }

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, username, email, password } = parsed.data;

  try {
    // Sign up via Better Auth
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        username,
        role: "owner",
      },
      headers: await headers(),
    });

    // Seed default app settings
    await db.insert(appSettings).values([
      { key: "app_name", value: JSON.stringify("Galeriku") },
      { key: "registration_open", value: JSON.stringify(false) },
      { key: "max_upload_photo_mb", value: JSON.stringify(20) },
      { key: "max_upload_video_mb", value: JSON.stringify(500) },
      { key: "storage_warning_pct", value: JSON.stringify(80) },
    ]).onConflictDoNothing();
  } catch {
    return { error: "Failed to create account. Email may already be in use." };
  }

  redirect("/albums");
}
```

- [ ] **Step 3: Create setup form component**

```tsx
// src/features/auth/components/setup-form.tsx
"use client";

import { useActionState } from "react";
import { setupOwner, type SetupState } from "@/features/auth/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(setupOwner, {});

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Galeriku</CardTitle>
        <CardDescription>Create your owner account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" placeholder="Your Name" required />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="username" required />
            {state.fieldErrors?.username && (
              <p className="text-destructive text-xs">{state.fieldErrors.username[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state.fieldErrors?.email && (
              <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 8 characters" required />
            {state.fieldErrors?.password && (
              <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create Owner Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create setup page**

```tsx
// src/app/(auth)/setup/page.tsx
import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SetupForm } from "@/features/auth/components/setup-form";

export default async function SetupPage() {
  // If any user exists, redirect to login
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count > 0) {
    redirect("/login");
  }

  return <SetupForm />;
}
```

- [ ] **Step 5: Verify setup wizard works**

```bash
pnpm dev
```

Visit `http://localhost:3000/setup`. Expected: Setup form renders with name, username, email, password fields. Fill in and submit — should create owner user and redirect to `/albums`.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/actions/setup.ts src/features/auth/components/setup-form.tsx src/app/\(auth\)
git commit -m "feat: add setup wizard for owner account creation"
```

---

## Task 8: Login Page

**Files:**
- Create: `src/features/auth/actions/login.ts`
- Create: `src/features/auth/components/login-form.tsx`
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create login action**

```typescript
// src/features/auth/actions/login.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // If no users exist, redirect to setup
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count === 0) {
    redirect("/setup");
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Invalid email or password" };
  }

  const callbackUrl = formData.get("callbackUrl")?.toString() || "/albums";
  redirect(callbackUrl);
}
```

- [ ] **Step 2: Create login form component**

```tsx
// src/features/auth/components/login-form.tsx
"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/features/auth/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Galeriku</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state.fieldErrors?.email && (
              <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {state.fieldErrors?.password && (
              <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

```tsx
// src/app/(auth)/login/page.tsx
import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  // If no users exist, redirect to setup
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count === 0) {
    redirect("/setup");
  }

  return <LoginForm callbackUrl={callbackUrl} />;
}
```

- [ ] **Step 4: Verify login flow**

```bash
pnpm dev
```

Visit `http://localhost:3000/login`. Sign in with the owner account created in setup. Expected: Redirect to `/albums`.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/actions/login.ts src/features/auth/components/login-form.tsx src/app/\(auth\)/login
git commit -m "feat: add login page with email/password auth"
```

---

## Task 9: Register Page

**Files:**
- Create: `src/features/auth/actions/register.ts`
- Create: `src/features/auth/components/register-form.tsx`
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create register action**

```typescript
// src/features/auth/actions/register.ts
"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  // Check if registration is open
  const setting = await db.select().from(appSettings).where(eq(appSettings.key, "registration_open")).limit(1);
  const isOpen = setting[0]?.value === true || setting[0]?.value === "true";

  if (!isOpen) {
    return { error: "Registration is currently closed. Contact the owner for an invite." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, username, email, password } = parsed.data;

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        username,
        role: "member",
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Failed to create account. Email or username may already be in use." };
  }

  redirect("/albums");
}
```

- [ ] **Step 2: Create register form component**

```tsx
// src/features/auth/components/register-form.tsx
"use client";

import { useActionState } from "react";
import { register, type RegisterState } from "@/features/auth/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, {});

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
        <CardDescription>Join Galeriku to share memories</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" placeholder="Your Name" required />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="username" required />
            {state.fieldErrors?.username && (
              <p className="text-destructive text-xs">{state.fieldErrors.username[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state.fieldErrors?.email && (
              <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 8 characters" required />
            {state.fieldErrors?.password && (
              <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create register page**

```tsx
// src/app/(auth)/register/page.tsx
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/actions/register.ts src/features/auth/components/register-form.tsx src/app/\(auth\)/register
git commit -m "feat: add register page with registration-open check"
```

---

## Task 10: Protected Home + Security Headers

**Files:**
- Create: `src/app/(main)/layout.tsx`
- Create: `src/app/(main)/albums/page.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Create main layout with app shell**

```tsx
// src/app/(main)/layout.tsx
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/app-shell";
import type { AuthUser } from "@/features/auth/types";
import type { ReactNode } from "react";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email,
    username: (session.user as Record<string, unknown>).username as string,
    name: session.user.name,
    image: session.user.image ?? null,
    role: ((session.user as Record<string, unknown>).role as string) === "owner" ? "owner" : "member",
  };

  return <AppShell user={user}>{children}</AppShell>;
}
```

- [ ] **Step 2: Create albums placeholder page**

```tsx
// src/app/(main)/albums/page.tsx
export default function AlbumsPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Galeriku</h1>
          <p className="text-sm text-muted-foreground">Your albums will appear here</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* Album grid placeholder — implemented in Plan 2 */}
        <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-1">+</div>
            <div className="text-xs">New Album</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add security headers to next.config.ts**

Replace `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from "next";

// CSP is handled in middleware.ts with per-request nonce
// Only static security headers here
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: End-to-end verification**

```bash
pnpm dev
```

Test full flow:
1. Visit `http://localhost:3000` → redirected to `/login`
2. If no users → `/login` redirects to `/setup`
3. Complete setup → redirected to `/albums` with app shell (bottom nav on mobile, top nav on desktop)
4. Logout → back to `/login`
5. Login with created account → `/albums` with app shell
6. Check security headers: `curl -I http://localhost:3000` → verify `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, etc.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\) next.config.ts
git commit -m "feat: add protected home page with app shell and security headers"
```

---

## Summary

After completing all 10 tasks, you have:

- **Working Next.js 15 project** with TypeScript, Tailwind CSS v4, shadcn/ui
- **PostgreSQL database** (Neon) with Drizzle ORM — user, session, account, verification, app_settings tables
- **Better Auth** configured with email/password, Argon2id hashing, session-based auth
- **Design system** with light mode default, dark mode toggle, Inter font, indigo/violet accent
- **Setup wizard** — first-time owner account creation at `/setup`
- **Login page** — email/password sign in at `/login`
- **Register page** — member registration at `/register` (controlled by registration_open setting)
- **Auth middleware** — protects all routes, owner-only check for `/admin/*`
- **App shell** — bottom nav (mobile) + top nav (desktop) + theme toggle
- **Security headers** — OWASP-compliant response headers
- **Placeholder albums page** — ready for Plan 2 to add album CRUD

**Next:** Plan 2 (Albums + Media Upload/View) builds on this foundation.
