import { test, expect } from '@playwright/test';
import { waitForApp, skipWelcomeGuide } from './helpers';

test.describe('Responsive Layout', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test.describe(`${vp.name} (${vp.width}px)`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('home page renders without horizontal overflow', async ({ page }) => {
        await skipWelcomeGuide(page);
        await page.goto('/');
        await waitForApp(page);

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
      });

      test('all main elements are visible', async ({ page }) => {
        await skipWelcomeGuide(page);
        await page.goto('/');
        await waitForApp(page);

        // Logo
        await expect(page.locator('h1:has-text("seQRets")')).toBeVisible();
        // Nav tabs
        await expect(page.getByText(/secure/i).first()).toBeVisible();
        // Form card
        await expect(page.getByText('Enter Your Secret')).toBeVisible();
      });

      test('about page no overflow', async ({ page }) => {
        await page.goto('/about');
        await page.waitForLoadState('networkidle');

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
      });

      test('inheritance page no overflow', async ({ page }) => {
        await skipWelcomeGuide(page);
        await page.goto('/inheritance');
        await page.waitForLoadState('networkidle');

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
      });

      test('go-pro page no overflow', async ({ page }) => {
        await page.goto('/go-pro');
        await page.waitForLoadState('networkidle');

        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
      });
    });
  }

  test.describe('mobile nav', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('nav tabs show short labels on mobile', async ({ page }) => {
      await skipWelcomeGuide(page);
      await page.goto('/');
      await waitForApp(page);

      // Mobile (<640px) shows short labels via sm:hidden spans
      // The short label spans are visible; long label spans are hidden
      const shortLabel = page.locator('span.sm\\:hidden').filter({ hasText: 'Secure' });
      await expect(shortLabel).toBeVisible();

      // Full labels should be hidden on mobile (hidden sm:inline)
      const fullLabel = page.locator('span.hidden.sm\\:inline').filter({ hasText: 'Secure Secret' });
      await expect(fullLabel).toBeHidden();
    });
  });

  test.describe('desktop nav', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('nav tabs show full labels on desktop', async ({ page }) => {
      await skipWelcomeGuide(page);
      await page.goto('/');
      await waitForApp(page);

      await expect(page.getByText('Secure Secret')).toBeVisible();
      await expect(page.getByText('Restore Secret')).toBeVisible();
    });
  });
});
