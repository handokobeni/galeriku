import { test, expect } from "@playwright/test";
import { cleanDatabase, closeDb } from "./helpers/db";

test.beforeEach(async ({ page }) => {
  await cleanDatabase();
  // Create a test user
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

test("can login with valid credentials", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/login");

  await page.getByLabel("Email").fill("owner@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/albums/);
});

test("shows error on invalid credentials", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/login");

  await page.getByLabel("Email").fill("owner@test.com");
  await page.getByLabel("Password").fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});

test("redirects unauthenticated user to login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/albums");
  await expect(page).toHaveURL(/\/login/);
});
