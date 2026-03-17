import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp } from './helpers';

test.describe('LocalStorage Resilience — Desktop', () => {
  test('app loads with completely empty localStorage', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForTimeout(3000);
    // Welcome guide should appear (localStorage cleared)
    await expect(page.locator('h1, [role="dialog"]').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toHaveLength(0);
  });

  test('corrupted welcome guide key', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.setItem('seQRets_welcomeGuideShown_v2', '{"broken');
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Should still work — treats invalid value as "not shown"
    expect(errors).toHaveLength(0);
  });

  test('corrupted theme value', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.setItem('seQRets_welcomeGuideShown_v2', 'true');
      localStorage.setItem('theme', 'invalid_theme_value');
    });
    await page.goto('/');
    await waitForApp(page);
    expect(errors).toHaveLength(0);
  });

  test('corrupted bob chat history', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.setItem('seQRets_welcomeGuideShown_v2', 'true');
      localStorage.setItem('bob-chat-history', 'not valid json at all');
    });
    await page.goto('/support');
    await waitForApp(page);
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('oversized localStorage does not crash the app', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
    // Try to fill localStorage near capacity
    await page.evaluate(() => {
      try {
        const bigData = 'X'.repeat(4_000_000);
        localStorage.setItem('stress_test', bigData);
      } catch {
        // Expected: QuotaExceededError
      }
    });
    await page.reload();
    await waitForApp(page);
    expect(errors).toHaveLength(0);
    // Clean up
    await page.evaluate(() => localStorage.removeItem('stress_test'));
  });
});
