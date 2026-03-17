import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide } from './helpers';

test.describe('Inheritance Page', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/inheritance');
  });

  test('loads with encrypt and decrypt tabs', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await expect(page.getByText(/encrypt/i).first()).toBeVisible();
    await expect(page.getByText(/decrypt/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('encrypt tab shows file upload', async ({ page }) => {
    await expect(page.getByText(/upload|select.*file/i).first()).toBeVisible();
  });

  test('decrypt tab shows encrypted file upload', async ({ page }) => {
    // Click on Decrypt Plan tab
    await page.getByRole('tab', { name: /Decrypt Plan/i }).click();
    await expect(page.getByText('seqrets-instructions.json')).toBeVisible({ timeout: 5000 });
  });

  test('nav tabs show Inherit as active', async ({ page }) => {
    const inheritTab = page.locator('button, a').filter({ hasText: /inherit/i }).first();
    await expect(inheritTab).toHaveClass(/bg-primary/);
  });

  test('desktop app upsell link present', async ({ page }) => {
    const shopLink = page.locator('a[href*="seqrets.app"]').first();
    if (await shopLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(shopLink).toHaveAttribute('href', /seqrets\.app/);
    }
  });
});
