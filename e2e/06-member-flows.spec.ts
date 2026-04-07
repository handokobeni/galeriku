import { test, expect } from "@playwright/test";
import { cleanDatabase, closeDb, setRegistrationOpen } from "./helpers/db";

async function createOwnerAccount(page: import("@playwright/test").Page) {
  await page.goto("/setup");
  await page.getByLabel("Display Name").fill("Owner User");
  await page.getByLabel("Username").fill("owneruser");
  await page.getByLabel("Email").fill("owner@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create owner account/i }).click();
  await expect(page).toHaveURL(/\/albums/);
}

async function registerMember(
  page: import("@playwright/test").Page,
  name: string,
  username: string,
  email: string
) {
  await page.goto("/register");
  await page.getByLabel("Display Name").fill(name);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /^create account$/i }).click();
  await expect(page).toHaveURL(/\/albums/);
}

async function logout(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
}

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password = "password123"
) {
  await logout(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/albums/);
}

test.beforeEach(async () => {
  await cleanDatabase();
});

test.afterAll(async () => {
  await closeDb();
});

test("member can create their own album", async ({ page }) => {
  await createOwnerAccount(page);
  await setRegistrationOpen(true);
  await logout(page);
  await registerMember(page, "Member User", "memberuser", "member@test.com");

  // Member is now logged in
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("My Member Album");
  await page.getByRole("button", { name: /^create album$/i }).click();

  await expect(page.getByText("My Member Album")).toBeVisible();
});

test("owner sees all albums including those created by members", async ({ page }) => {
  await createOwnerAccount(page);
  await setRegistrationOpen(true);

  // Member creates an album
  await logout(page);
  await registerMember(page, "Member One", "memberone", "member1@test.com");
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Member's Album");
  await page.getByRole("button", { name: /^create album$/i }).click();
  await expect(page.getByText("Member's Album")).toBeVisible();

  // Login as owner — should see member's album
  await loginAs(page, "owner@test.com");
  await expect(page.getByText("Member's Album")).toBeVisible();
});

test("member only sees their own albums, not others", async ({ page }) => {
  await createOwnerAccount(page);
  await setRegistrationOpen(true);

  // Owner creates an album
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Owner's Album");
  await page.getByRole("button", { name: /^create album$/i }).click();
  await expect(page.getByText("Owner's Album")).toBeVisible();

  // Member registers and shouldn't see owner's album
  await logout(page);
  await registerMember(page, "Member One", "memberone", "member1@test.com");
  await page.goto("/albums");
  await expect(page.getByText("Owner's Album")).not.toBeVisible();
});

test("can invite member via search autocomplete", async ({ page }) => {
  await createOwnerAccount(page);
  await setRegistrationOpen(true);

  // Create a member first (as a user that can be invited)
  await logout(page);
  await registerMember(page, "Alice Inviteme", "alice", "alice@test.com");

  // Login as owner and create album
  await loginAs(page, "owner@test.com");
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Shared Album");
  await page.getByRole("button", { name: /^create album$/i }).click();
  await page.getByText("Shared Album").click();

  // Open members dialog via the Members button
  await page.getByRole("button", { name: "Members" }).click();

  // Search for Alice in the search input
  await page.getByPlaceholder(/search by name or email/i).fill("Alice");

  // Wait for search results to appear
  await expect(page.getByText("Alice Inviteme")).toBeVisible();

  // Click on Alice to select her
  await page.getByText("Alice Inviteme").click();

  // The invite button should appear
  await expect(page.getByRole("button", { name: /invite as/i })).toBeVisible();

  // Click invite
  await page.getByRole("button", { name: /invite as/i }).click();

  // Alice should now appear in the members list
  await expect(page.getByText("alice@test.com")).toBeVisible();
});

test("editor cannot manage members", async ({ page }) => {
  await createOwnerAccount(page);
  await setRegistrationOpen(true);

  // Create a member account for the editor
  await logout(page);
  await registerMember(page, "Editor User", "editoruser", "editor@test.com");

  // Login as owner, create album, invite editor as editor role
  await loginAs(page, "owner@test.com");
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Test Album");
  await page.getByRole("button", { name: /^create album$/i }).click();
  await page.getByText("Test Album").click();

  // Open members dialog and invite Editor User as editor
  await page.getByRole("button", { name: "Members" }).click();
  await page.getByPlaceholder(/search by name or email/i).fill("Editor");
  await expect(page.getByText("Editor User")).toBeVisible();
  await page.getByText("Editor User").click();
  const inviteSelect = page.locator("select").first();
  await inviteSelect.selectOption("editor");
  await page.getByRole("button", { name: /invite as editor/i }).click();
  await expect(page.getByText("editor@test.com")).toBeVisible();

  // Close dialog and login as editor
  await page.keyboard.press("Escape");
  await loginAs(page, "editor@test.com");
  await page.goto("/albums");
  await page.getByText("Test Album").click();

  // Open members dialog as editor
  await page.getByRole("button", { name: "Members" }).click();

  // Editor should NOT see the search input or member management controls
  await expect(page.getByPlaceholder(/search by name or email/i)).not.toBeVisible();
  await expect(page.getByLabel("Member role")).not.toBeVisible();
});

test("can edit member role from members dialog", async ({ page }) => {
  await createOwnerAccount(page);
  await setRegistrationOpen(true);

  // Create a second user (member to be invited)
  await logout(page);
  await registerMember(page, "Bob Member", "bobmember", "bob@test.com");

  // Login as owner, create album, invite Bob
  await loginAs(page, "owner@test.com");
  await page.goto("/albums");
  await page.getByText("New Album").click();
  await page.getByLabel("Album Name").fill("Test Album");
  await page.getByRole("button", { name: /^create album$/i }).click();
  await page.getByText("Test Album").click();

  // Open members dialog
  await page.getByRole("button", { name: "Members" }).click();

  // Search and invite Bob as viewer
  await page.getByPlaceholder(/search by name or email/i).fill("Bob");
  await expect(page.getByText("Bob Member")).toBeVisible();
  await page.getByText("Bob Member").click();
  await page.getByRole("button", { name: /invite as viewer/i }).click();

  // Bob should appear in the members list
  await expect(page.getByText("bob@test.com")).toBeVisible();

  // Change Bob's role to editor — Bob is the second member (after the owner)
  // so use nth(1) to target his role select
  const roleSelect = page.getByLabel("Member role").nth(1);
  await expect(roleSelect).toHaveValue("viewer");
  await roleSelect.selectOption("editor");

  // The select should now show editor
  await expect(roleSelect).toHaveValue("editor");
});
