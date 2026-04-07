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

test("favorites page shows empty state when no favorites", async ({ page }) => {
  await page.goto("/favorites");
  await expect(page.getByRole("heading", { name: "Favorites" })).toBeVisible();
  await expect(page.getByText(/no favorites yet/i)).toBeVisible();
});
