import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp, DESKTOP_ROUTES } from './helpers';

test.describe('Navigation & Routing — Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
  });

  for (const route of DESKTOP_ROUTES) {
    test(`${route} loads without errors`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      await page.goto(route);
      await waitForApp(page);
      expect(errors).toHaveLength(0);
    });
  }

  test('home page shows Create tab by default', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('?tab=restore loads Restore tab', async ({ page }) => {
    await page.goto('/?tab=restore');
    await waitForApp(page);
    await expect(page.getByText('Restore From Backup')).toBeVisible();
  });

  test('?tab=create loads Create tab', async ({ page }) => {
    await page.goto('/?tab=create');
    await waitForApp(page);
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('tab switching works via nav tabs', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    // Click Restore Secret nav tab (exact name to avoid matching step 3 button)
    await page.getByRole('button', { name: 'Restore Secret' }).click();
    await expect(page.getByText('Restore From Backup')).toBeVisible();
    // Click Secure Secret tab
    await page.getByRole('button', { name: /Secure Secret/ }).click();
    await expect(page.getByText('Secure Your Secret')).toBeVisible();
  });

  test('Inheritance Plan tab navigates to /inheritance', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole('button', { name: /Inheritance Plan/ }).click();
    await expect(page).toHaveURL(/\/inheritance/);
  });

  test('about page loads with content', async ({ page }) => {
    await page.goto('/about');
    await waitForApp(page);
    await expect(page.getByText('Security Architecture')).toBeVisible();
  });

  test('support page loads (Bob AI)', async ({ page }) => {
    await page.goto('/support');
    await waitForApp(page);
    // Should have Bob chat interface
    await expect(page.getByText(/Bob|assistant|AI/i).first()).toBeVisible();
  });

  test('smart card page loads', async ({ page }) => {
    await page.goto('/smartcard');
    await waitForApp(page);
    await expect(page.getByText(/Smart Card/i).first()).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await waitForApp(page);
    await expect(page.getByText(/privacy/i).first()).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await waitForApp(page);
    await expect(page.getByText(/terms/i).first()).toBeVisible();
  });

  test('browser back/forward works', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.goto('/about');
    await waitForApp(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/about/);
  });

  test('unknown route does not crash', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(2000);
    // App should show something (blank page or redirect to home)
    // At minimum, no crash
    expect(errors).toHaveLength(0);
  });

  test('page refresh preserves route', async ({ page }) => {
    await page.goto('/about');
    await waitForApp(page);
    await page.reload();
    await waitForApp(page);
    await expect(page).toHaveURL(/\/about/);
  });
});
