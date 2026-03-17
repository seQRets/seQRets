import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers';

test.describe('Welcome Guide — Desktop', () => {
  test('welcome guide appears on first visit', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.removeItem('seQRets_welcomeGuideShown_v2'));
    await page.goto('/');
    // Wait for welcome dialog to appear
    await expect(page.getByText('seQRets').first()).toBeVisible({ timeout: 10000 });
    // Should have the dialog overlay (blocks interaction)
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('3-step progression: Next → Next → I Understand & Accept', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.removeItem('seQRets_welcomeGuideShown_v2'));
    await page.goto('/');
    // Step 1
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Next/i }).click();
    // Step 2
    await expect(page.getByText('What Can You Do?')).toBeVisible();
    await page.getByRole('button', { name: /Next/i }).click();
    // Step 3
    await expect(page.getByText('Before You Begin')).toBeVisible();
    await page.getByRole('button', { name: /I Understand & Accept/i }).click();
    // Welcome guide should close, app should be visible
    await expect(page.getByText('Secure Your Secret')).toBeVisible({ timeout: 5000 });
  });

  test('welcome guide sets localStorage key on dismiss', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.removeItem('seQRets_welcomeGuideShown_v2'));
    await page.goto('/');
    // Step through
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /I Understand & Accept/i }).click();
    await page.waitForTimeout(500);
    const val = await page.evaluate(() => localStorage.getItem('seQRets_welcomeGuideShown_v2'));
    expect(val).toBe('true');
  });

  test('welcome guide does not appear after dismissal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.setItem('seQRets_welcomeGuideShown_v2', 'true'));
    await page.goto('/');
    await expect(page.getByText('Secure Your Secret')).toBeVisible({ timeout: 10000 });
    // Welcome dialog should NOT be visible
    await expect(page.getByRole('button', { name: /I Understand & Accept/i })).not.toBeVisible();
  });

  test('welcome guide blocks outside interaction (escape key)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.removeItem('seQRets_welcomeGuideShown_v2'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible({ timeout: 10000 });
    // Try Escape — should NOT close the dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
  });
});
