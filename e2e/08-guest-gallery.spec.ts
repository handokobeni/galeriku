import { test, expect } from "@playwright/test";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import { cleanDatabase, closeDb } from "./helpers/db";

const sql = postgres(
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:57432/galeriku?sslmode=disable",
);

let publicSlug: string;
let passwordSlug: string;
let expiredSlug: string;

test.beforeAll(async () => {
  await cleanDatabase();
  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userId = crypto.randomUUID();
  await sql`
    INSERT INTO "user" (id, name, email, email_verified, username, role)
    VALUES (${userId}, 'Studio E2E', ${`e2e-${uniq}@x.io`}, true, ${`e2e-${uniq}`}, 'owner')
  `;

  publicSlug = `e2e12-public-${uniq.slice(0, 6)}`;
  const publicId = crypto.randomUUID();
  await sql`
    INSERT INTO album (id, name, slug, is_public, created_by, published_at, download_policy)
    VALUES (${publicId}, 'Public Album', ${publicSlug}, true, ${userId}, NOW(), 'none')
  `;
  await sql`
    INSERT INTO media (album_id, uploaded_by, type, filename, r2_key, thumbnail_r2_key, mime_type, size_bytes, variant_status)
    VALUES (${publicId}, ${userId}, 'photo', 'p.jpg', 'test/p.jpg', 'test/p-thumb.jpg', 'image/jpeg', 1, 'ready')
  `;

  passwordSlug = `e2e12-locked-${uniq.slice(0, 6)}`;
  const ph = await hash("hunter2");
  await sql`
    INSERT INTO album (id, name, slug, is_public, password_hash, created_by, published_at, download_policy)
    VALUES (${crypto.randomUUID()}, 'Locked Album', ${passwordSlug}, true, ${ph}, ${userId}, NOW(), 'none')
  `;

  expiredSlug = `e2e12-expired-${uniq.slice(0, 6)}`;
  const yesterday = new Date(Date.now() - 86400_000);
  await sql`
    INSERT INTO album (id, name, slug, is_public, created_by, published_at, expires_at, download_policy)
    VALUES (${crypto.randomUUID()}, 'Expired', ${expiredSlug}, true, ${userId}, NOW(), ${yesterday}, 'none')
  `;
});

test.afterAll(async () => {
  await sql.end();
  await closeDb();
});

test("public album shows heading and favorite-with-name flow opens modal", async ({ page }) => {
  await page.goto(`/g/${publicSlug}`);
  await expect(page.getByRole("heading", { name: "Public Album" })).toBeVisible();
  await page.getByRole("button", { name: "Favorite" }).first().click();
  await expect(page.getByPlaceholder(/nama/i)).toBeVisible();
});

test("password gate flow", async ({ page }) => {
  await page.goto(`/g/${passwordSlug}`);
  await expect(page.getByText("Album terkunci")).toBeVisible();
  await page.getByPlaceholder(/password/i).fill("wrong");
  await page.getByRole("button", { name: /unlock/i }).click();
  await expect(page.getByText(/password salah/i)).toBeVisible();
  await page.getByPlaceholder(/password/i).fill("hunter2");
  await page.getByRole("button", { name: /unlock/i }).click();
  await expect(page.getByRole("heading", { name: "Locked Album" })).toBeVisible({ timeout: 10000 });
});

test("expired album shows 'sudah berakhir'", async ({ page }) => {
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
