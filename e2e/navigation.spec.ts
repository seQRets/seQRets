import { test, expect } from '@playwright/test';
import { trackConsoleErrors, waitForApp, skipWelcomeGuide } from './helpers';

test.describe('Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
  });

  test('home page loads with title', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/');
    await waitForApp(page);
    await expect(page).toHaveTitle(/seQRets/i);
    expect(errors).toEqual([]);
  });

  test('about page loads', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/about');
    await expect(page.getByText('Security Architecture')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('support page loads', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/support');
    await expect(page.getByText(/bob/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('go-pro page loads', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/go-pro');
    await expect(page.getByText(/go pro/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('inheritance page loads', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/inheritance');
    await expect(page.getByRole('heading', { name: /Inheritance Planning/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('privacy page loads', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/privacy');
    await expect(page.getByText(/privacy/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('terms page loads', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/terms');
    await expect(page.getByText(/terms/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('404 page for unknown route', async ({ page }) => {
    const response = await page.goto('/nonexistent-route-xyz');
    // GitHub Pages static export: may return 200 with fallback or 404
    // Either way the page should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('direct URL access to restore tab', async ({ page }) => {
    await page.goto('/?tab=restore');
    await waitForApp(page);
    await expect(page.getByText('Restore From Backup')).toBeVisible();
  });

  test('direct URL access to create tab', async ({ page }) => {
    await page.goto('/?tab=create');
    await waitForApp(page);
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('nav tabs switch between create and restore', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Should start on create tab
    await expect(page.getByText('Secure Your Secret')).toBeVisible();

    // Click Restore tab
    await page.getByRole('button', { name: /restore/i }).click();
    await expect(page.getByText('Restore From Backup')).toBeVisible();

    // Click Secure tab to go back
    await page.getByRole('button', { name: /secure/i }).click();
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('nav tab links to inheritance page', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Click Inheritance Plan tab (it's a link)
    await page.getByRole('link', { name: /inherit/i }).click();
    await page.waitForURL('**/inheritance');
    await expect(page.getByRole('heading', { name: /Inheritance Planning/i })).toBeVisible();
  });

  test('hamburger menu navigates to about', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Open hamburger menu (look for the menu button)
    const menuButton = page.locator('button').filter({ has: page.locator('.lucide-menu') }).first();
    await menuButton.click();

    // Click About link
    await page.getByRole('menuitem', { name: /about/i }).or(page.getByRole('link', { name: /about/i })).first().click();
    await page.waitForURL('**/about');
  });

  test('browser back/forward navigation works', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    await page.goto('/about');
    await expect(page.getByText('Security Architecture')).toBeVisible();

    await page.goBack();
    await waitForApp(page);
    await expect(page.getByText('Secure Your Secret')).toBeVisible();

    await page.goForward();
    await expect(page.getByText('Security Architecture')).toBeVisible();
  });

  test('page refresh preserves route', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('Security Architecture')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Security Architecture')).toBeVisible();
  });
});
