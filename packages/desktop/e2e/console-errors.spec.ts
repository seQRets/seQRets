import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp, DESKTOP_ROUTES } from './helpers';

test.describe('Console Errors — Desktop', () => {
  for (const route of DESKTOP_ROUTES) {
    test(`zero console errors on ${route}`, async ({ page }) => {
      await skipWelcomeGuide(page);
      const errors = trackConsoleErrors(page);
      await page.goto(route);
      await waitForApp(page);
      // Allow time for async effects
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });
  }

  test('zero console errors on restore tab', async ({ page }) => {
    await skipWelcomeGuide(page);
    const errors = trackConsoleErrors(page);
    await page.goto('/?tab=restore');
    await waitForApp(page);
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});
