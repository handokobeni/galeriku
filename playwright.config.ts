import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Run sequentially to avoid DB conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker — tests share DB state
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Use .env.test so dev server connects to galeriku_test DB
    command: "dotenv -e .env.test -- next dev",
    url: "http://localhost:3000",
    reuseExistingServer: false, // Always start fresh server with test env
    timeout: 120 * 1000,
  },
});
