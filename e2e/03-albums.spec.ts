import { test, expect } from "@playwright/test";
import { cleanDatabase, closeDb } from "./helpers/db";

test.beforeEach(async ({ page }) => {
  await cleanDatabase();
  // Create user and login
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

test("can create new album", async ({ page }) => {
  await page.goto("/albums");

  // Click the "New Album" trigger button
  await page.getByText("New Album").click();

  // Fill the dialog form
  await page.getByLabel("Album Name").fill("Liburan Bali");
  await page.getByLabel(/description/i).fill("Summer trip to Bali");
  await page.getByRole("button", { name: /^create album$/i }).click();

  // Album should appear in the grid
  await expect(page.getByText("Liburan Bali")).toBeVisible();
});

test("can navigate to album detail", async ({ page }) => {
  // Create an album first
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Test Album");
  await page.getByRole("button", { name: /^create album$/i }).click();

  // Click on the album card
  await page.getByText("Test Album").click();

  // Should navigate to album detail
  await expect(page).toHaveURL(/\/albums\/[a-f0-9-]+/);
  await expect(page.getByRole("heading", { name: "Test Album" })).toBeVisible();
});

test("shows empty state when no media", async ({ page }) => {
  // Create album and navigate to it
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Empty Album");
  await page.getByRole("button", { name: /^create album$/i }).click();
  await page.getByText("Empty Album").click();

  await expect(page.getByText(/no media yet/i)).toBeVisible();
});
