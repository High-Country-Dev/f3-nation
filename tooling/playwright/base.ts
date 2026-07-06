import type { PlaywrightTestConfig } from "@playwright/test";
import { defineConfig, devices } from "@playwright/test";

/**
 * Shared base config for the blocking-tier E2E suites.
 *
 * The suites run against a deployed target (per-PR preview environments in
 * CI — see .github/workflows/preview-env.yml), never a local dev server, so
 * `E2E_BASE_URL` is required. Preview environments scale to zero, which means
 * the first navigation may sit through a Cloud Run cold start (~10s); the
 * timeouts below are sized for that.
 *
 * Usage (apps/<app>/playwright.config.ts):
 *
 *   import { createBaseConfig } from "@acme/playwright-config";
 *   export default createBaseConfig();
 *
 * Pass overrides to tweak per app, e.g. `createBaseConfig({ workers: 2 })`.
 */
export function createBaseConfig(
  overrides: PlaywrightTestConfig = {},
): PlaywrightTestConfig {
  const baseURL = process.env.E2E_BASE_URL;
  if (!baseURL) {
    throw new Error(
      "E2E_BASE_URL is required but not set. Point it at the deployment " +
        "under test, e.g. " +
        "E2E_BASE_URL=https://pr-123-map-<project>.us-central1.run.app " +
        "pnpm test:e2e",
    );
  }

  return defineConfig(
    {
      testMatch: "**/tests/e2e/**/*.spec.ts",
      // Cold-starting scale-to-zero target: allow generous per-test budget.
      timeout: 90_000,
      expect: { timeout: 15_000 },
      retries: process.env.CI ? 1 : 0,
      // Single worker by default — the preview env runs max 1 instance and
      // the suites share app state (map viewport, panels). Override per app
      // if a suite is safe to parallelize.
      workers: 1,
      forbidOnly: !!process.env.CI,
      reporter: [["list"], ["html", { open: "never" }]],
      use: {
        baseURL,
        trace: "retain-on-failure",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
        actionTimeout: 15_000,
        // First navigation may include a Cloud Run cold start.
        navigationTimeout: 45_000,
      },
      // Chromium only for now; add firefox/webkit projects when the suite
      // is stable enough to be worth the CI minutes.
      projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    },
    overrides,
  );
}
