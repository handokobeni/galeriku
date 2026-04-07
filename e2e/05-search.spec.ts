import { test, expect } from "@playwright/test";
import { cleanDatabase, closeDb } from "./helpers/db";

test.beforeEach(async ({ page }) => {
  await cleanDatabase();
  await page.goto("/setup");
  await page.getByLabel("Display Name").fill("Test Owner");
  await page.getByLabel("Username").fill("testowner");
  await page.getByLabel("Email").fill("owner@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create owner account/i }).click();
  await expect(page).toHaveURL(/\/albums/);
});

test.afterAll(async () => {
  await closeDb();
});

test("can search and find album by name", async ({ page }) => {
  // Create an album
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Liburan Bali");
  await page.getByRole("button", { name: /^create album$/i }).click();

  // Go to search
  await page.goto("/search");
  await page.getByPlaceholder(/search/i).fill("bali");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=bali/);
  await expect(page.getByText("Liburan Bali")).toBeVisible();
});

test("shows no results for empty query", async ({ page }) => {
  await page.goto("/search?q=nonexistent");
  await expect(page.getByText(/no results/i)).toBeVisible();
});
