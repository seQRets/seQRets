import { test, expect } from '@playwright/test';
import { waitForApp, skipWelcomeGuide } from './helpers';

test.describe('LocalStorage Edge Cases', () => {
  test('app works with empty localStorage', async ({ page }) => {
    // Don't skip welcome guide — test clean state, just check it doesn't crash
    await page.goto('/');
    await page.waitForSelector('h1:has-text("seQRets")', { timeout: 15000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('app handles corrupted localStorage gracefully', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.evaluate(() => {
      localStorage.setItem('bob-chat-history', '{invalid json}}}');
      localStorage.setItem('theme', 'not-a-valid-theme');
      localStorage.setItem('seqrets-welcome-dismissed', 'maybe');
    });
    await page.reload();
    await waitForApp(page);
    // App should still load without crashing
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('app handles oversized localStorage value', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.evaluate(() => {
      try {
        // Try to fill localStorage with a large value
        const bigString = 'x'.repeat(5 * 1024 * 1024); // 5MB
        localStorage.setItem('test-large', bigString);
      } catch (e) {
        // Expected — quota exceeded
      }
    });
    await page.reload();
    await waitForApp(page);
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('app handles localStorage being unavailable', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // Override localStorage to throw
      Object.defineProperty(window, 'localStorage', {
        get() { throw new DOMException('SecurityError'); }
      });
    });
    // Reload and check the page still renders something
    await page.reload();
    // It may error, but should not crash completely
    await expect(page.locator('body')).toBeVisible();
  });

  test('theme persists across page reload', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);

    // Get current theme state
    const htmlClass = await page.locator('html').getAttribute('class');
    const isDark = htmlClass?.includes('dark');

    // Reload and verify theme persisted
    await page.reload();
    await waitForApp(page);
    const htmlClassAfter = await page.locator('html').getAttribute('class');
    const isDarkAfter = htmlClassAfter?.includes('dark');

    expect(isDark).toEqual(isDarkAfter);
  });
});
