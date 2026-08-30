import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: false,
  outputDir: "test-results",
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /\.mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /\.mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
  reporter: [["line"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  retries: 0,
  testDir: "./e2e",
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    reuseExistingServer: true,
    timeout: 60_000,
    url: baseURL,
  },
});
