import { test, expect } from '@playwright/test';
import { skipWelcomeGuide, waitForApp } from './helpers';

const viewports = [
  { name: 'small (800x700)', width: 800, height: 700 },
  { name: 'medium (1024x900)', width: 1024, height: 900 },
  { name: 'large (1440x900)', width: 1440, height: 900 },
];

test.describe('Responsive & Window Sizes — Desktop', () => {
  for (const vp of viewports) {
    test.describe(`viewport: ${vp.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await skipWelcomeGuide(page);
      });

      test('home page has no horizontal overflow', async ({ page }) => {
        await page.goto('/');
        await waitForApp(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow).toBe(false);
      });

      test('all main elements are visible', async ({ page }) => {
        await page.goto('/');
        await waitForApp(page);
        await expect(page.locator('h1:has-text("seQRets")')).toBeVisible();
        await expect(page.getByText('Secure Your Secret')).toBeVisible();
      });

      test('about page has no overflow', async ({ page }) => {
        await page.goto('/about');
        await waitForApp(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow).toBe(false);
      });

      test('inheritance page has no overflow', async ({ page }) => {
        await page.goto('/inheritance');
        await waitForApp(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow).toBe(false);
      });

      test('smart card page has no overflow', async ({ page }) => {
        await page.goto('/smartcard');
        await waitForApp(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow).toBe(false);
      });
    });
  }

  test('min window size (800x700) is usable', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 });
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
    // Critical elements visible
    await expect(page.locator('#secret')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeVisible();
  });
});
