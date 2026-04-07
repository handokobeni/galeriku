import { test, expect } from "@playwright/test";
import { cleanDatabase, closeDb } from "./helpers/db";

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await closeDb();
});

test("first-time visitor sees setup wizard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup/);
  await expect(page.getByText("Welcome to Galeriku")).toBeVisible();
});

test("can create owner account via setup wizard", async ({ page }) => {
  await page.goto("/setup");

  await page.getByLabel("Display Name").fill("Test Owner");
  await page.getByLabel("Username").fill("testowner");
  await page.getByLabel("Email").fill("owner@test.com");
  await page.getByLabel("Password").fill("password123");

  await page.getByRole("button", { name: /create owner account/i }).click();

  await expect(page).toHaveURL(/\/albums/);
  await expect(page.getByRole("heading", { name: "Albums" })).toBeVisible();
});

test("setup wizard redirects to login if user already exists", async ({ page, context }) => {
  // First, create a user
  await page.goto("/setup");
  await page.getByLabel("Display Name").fill("Test Owner");
  await page.getByLabel("Username").fill("testowner");
  await page.getByLabel("Email").fill("owner@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create owner account/i }).click();
  await expect(page).toHaveURL(/\/albums/);

  // Clear cookies and visit /setup again
  await context.clearCookies();
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login/);
});
