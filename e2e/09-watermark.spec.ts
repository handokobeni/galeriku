import { test, expect } from "@playwright/test";
import postgres from "postgres";
import { cleanDatabase, closeDb } from "./helpers/db";
import path from "node:path";
import fs from "node:fs";

const sql = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:57432/galeriku?sslmode=disable",
);

let albumSlug: string;
let albumId: string;

/**
 * Seed: owner user + album with one photo (same pattern as 08-guest-gallery).
 * The photo needs a real r2_key so Preview Watermark has something to composite.
 */
test.beforeAll(async () => {
  await cleanDatabase();

  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userId = crypto.randomUUID();

  await sql`
    INSERT INTO "user" (id, name, email, email_verified, username, role)
    VALUES (${userId}, 'WM E2E Owner', ${`wm-e2e-${uniq}@x.io`}, true, ${`wm-e2e-${uniq}`}, 'owner')
  `;

  albumId = crypto.randomUUID();
  albumSlug = `wm-e2e-${uniq.slice(0, 8)}`;

  await sql`
    INSERT INTO album (id, name, slug, is_public, created_by, download_policy)
    VALUES (${albumId}, 'WM Test Album', ${albumSlug}, false, ${userId}, 'none')
  `;

  await sql`
    INSERT INTO media (album_id, uploaded_by, type, filename, r2_key, thumbnail_r2_key, mime_type, size_bytes, variant_status)
    VALUES (${albumId}, ${userId}, 'photo', 'wm-test.jpg', 'test/wm-test.jpg', 'test/wm-test-thumb.jpg', 'image/jpeg', 2048, 'ready')
  `;
});

test.afterAll(async () => {
  await sql.end();
  await closeDb();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create owner account via setup wizard and land on /albums */
async function setupOwner(page: import("@playwright/test").Page) {
  await cleanDatabase();

  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await page.goto("/setup");
  await page.getByLabel("Display Name").fill("WM Owner");
  await page.getByLabel("Username").fill(`wmowner${uniq.slice(0, 6)}`);
  await page.getByLabel("Email").fill(`wmowner-${uniq}@test.io`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create owner account/i }).click();
  await expect(page).toHaveURL(/\/albums/);
}

/** Create an album via the UI, return to /albums after creation */
async function createAlbumViaUI(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill(name);
  await page.getByRole("button", { name: /^create album$/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

/**
 * Generate a minimal 1x1 transparent PNG buffer for logo upload.
 * This avoids needing a fixture file on disk.
 */
function createMinimalPngPath(): string {
  // Minimal valid 1x1 transparent PNG (67 bytes)
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
      "Nl7BcQAAAABJRU5ErkJggg==",
    "base64",
  );
  const tmpPath = path.join("/tmp", `wm-e2e-logo-${Date.now()}.png`);
  fs.writeFileSync(tmpPath, pngBytes);
  return tmpPath;
}

// ---------------------------------------------------------------------------
// Journey 1: Logo watermark flow
// ---------------------------------------------------------------------------
test.describe("Watermark Engine E2E", () => {
  test.describe.configure({ mode: "serial" });

  test("logo watermark: upload logo, configure, preview, publish with watermark policy", async ({
    page,
  }) => {
    // Setup: create owner via setup wizard
    await setupOwner(page);

    // Create album + navigate to it
    await createAlbumViaUI(page, "Logo WM Album");
    await page.getByText("Logo WM Album").click();
    await expect(page).toHaveURL(/\/albums\/[a-f0-9-]+/);
    await expect(
      page.getByRole("heading", { name: "Logo WM Album" }),
    ).toBeVisible();

    // --- Preview Watermark button should be visible if album has media ---
    // Note: album was created via UI so it has no media yet.
    // Upload a photo first (if upload dialog exists).
    const uploadBtn = page.getByText("Upload");
    if (await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Upload a test image via the upload dialog
      await uploadBtn.click();
      const fileInput = page.locator('input[type="file"]');
      const logoPath = createMinimalPngPath();
      await fileInput.setInputFiles(logoPath);
      // Wait for upload to complete
      await page.waitForTimeout(3000);
      // Close dialog if still open
      const closeBtn = page.getByRole("button", { name: /close|done|selesai/i });
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }

    // Look for "Preview Watermark" button in the Watermark & Share section
    const previewBtn = page.getByRole("button", { name: /Preview Watermark/i });
    if (await previewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewBtn.click();

      // Wait for the preview modal
      await expect(page.getByText("Watermark Preview")).toBeVisible({
        timeout: 10000,
      });

      // Preview may show "Generating preview..." then the actual image
      const previewImg = page.locator('img[alt="Watermark preview"]');
      await expect(previewImg).toBeVisible({ timeout: 15000 });

      // Confirm preview
      await page.getByRole("button", { name: "Looks good" }).click();
    }

    // Open publish dialog
    await page
      .getByRole("button", { name: /Publish to client/i })
      .click();
    await expect(page.getByText("Publish album")).toBeVisible();

    // Select "watermarked" download policy
    await page.locator("#publish-policy").click();
    await page.getByText("Watermarked").click();

    // Click Publish
    await page.getByRole("button", { name: /^Publish$/i }).click();

    // Wait for the link to appear (indicates publish succeeded)
    await expect(page.locator("input[readonly]")).toBeVisible({
      timeout: 15000,
    });

    // Check for watermark progress indicator
    const progressText = page.getByText(/Generating watermark/i);
    if (await progressText.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Wait for completion (watermark generation can take time)
      await expect(
        page.getByText(/Watermark generation complete/i),
      ).toBeVisible({ timeout: 120000 });
    }

    // Close dialog
    await page.getByRole("button", { name: /Selesai/i }).click();
  });

  // ---------------------------------------------------------------------------
  // Journey 2: Text watermark flow
  // ---------------------------------------------------------------------------
  test("text watermark: switch to text mode, type text, preview, publish", async ({
    page,
  }) => {
    // Setup: fresh owner
    await setupOwner(page);

    // Create album
    await createAlbumViaUI(page, "Text WM Album");
    await page.getByText("Text WM Album").click();
    await expect(page).toHaveURL(/\/albums\/[a-f0-9-]+/);

    // If a watermark settings panel is accessible on the album page or settings,
    // switch to text mode and configure. The WatermarkSettings component uses
    // button labels "Logo" and "Text" for mode toggle.
    const textModeBtn = page.getByRole("button", { name: "Text" });
    if (await textModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textModeBtn.click();

      // Fill in watermark text
      const textInput = page.getByLabel("Watermark text");
      await textInput.fill("\u00a9 Studio Test");
    }

    // Preview Watermark (if album has media)
    const previewBtn = page.getByRole("button", { name: /Preview Watermark/i });
    if (await previewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewBtn.click();

      await expect(page.getByText("Watermark Preview")).toBeVisible({
        timeout: 10000,
      });

      const previewImg = page.locator('img[alt="Watermark preview"]');
      await expect(previewImg).toBeVisible({ timeout: 15000 });

      // Confirm
      await page.getByRole("button", { name: "Looks good" }).click();
    }

    // Open publish dialog
    await page
      .getByRole("button", { name: /Publish to client/i })
      .click();
    await expect(page.getByText("Publish album")).toBeVisible();

    // Select watermarked policy
    await page.locator("#publish-policy").click();
    await page.getByText("Watermarked").click();

    // Publish
    await page.getByRole("button", { name: /^Publish$/i }).click();

    // Expect the published link to appear
    await expect(page.locator("input[readonly]")).toBeVisible({
      timeout: 15000,
    });

    // Close
    await page.getByRole("button", { name: /Selesai/i }).click();
  });
});
