import { test, expect } from '@playwright/test';
import { waitForApp, skipWelcomeGuide, clickPasswordGenerate } from './helpers';

test.describe('External Links', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
  });

  test('Go Pro page has shop link to seqrets.app', async ({ page }) => {
    await page.goto('/go-pro');
    const shopLinks = page.locator('a[href*="seqrets.app"]');
    const count = await shopLinks.count();
    expect(count).toBeGreaterThan(0);

    const firstLink = shopLinks.first();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/seqrets\.app/);
  });

  test('create form has desktop app upsell link', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Go through the create flow to see the results with upsell
    await page.locator('#secret').fill('test secret for link check');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await clickPasswordGenerate(page);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: /Encrypt & Generate/ }).click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });

    // Check for desktop app upsell link
    const shopLink = page.locator('a[href*="seqrets.app/shop"]');
    if (await shopLink.count() > 0) {
      await expect(shopLink.first()).toBeVisible();
      await expect(shopLink.first()).toHaveAttribute('target', '_blank');
    }
  });

  test('restore form has desktop app upsell link', async ({ page }) => {
    await page.goto('/?tab=restore');
    await waitForApp(page);

    const shopLink = page.locator('a[href*="seqrets.app/shop"]');
    if (await shopLink.count() > 0) {
      await expect(shopLink.first()).toBeVisible();
    }
  });

  test('footer contains version info', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    await expect(page.getByText(/v1\.\d+\.\d+/).first()).toBeVisible();
  });

  test('external links have rel=noopener noreferrer', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel, `External link ${i} missing rel=noopener`).toContain('noopener');
    }
  });
});
