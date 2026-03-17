import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for seQRets Desktop (Tauri + Vite).
 *
 * Tests run against the Vite dev server at http://localhost:5173.
 * Start the desktop app first: `npm run tauri:dev` (or `npm run dev` for Vite-only).
 *
 * Usage:
 *   npx playwright test --config packages/desktop/playwright.config.ts --headed
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
