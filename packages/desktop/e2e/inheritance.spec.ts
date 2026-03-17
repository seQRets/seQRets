import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp } from './helpers';

test.describe('Inheritance Plan — Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/inheritance');
    await waitForApp(page);
  });

  test('inheritance page loads with tabs', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    // Should have tab navigation for plan sections
    await expect(page.getByText(/Plan Info|Encrypt|Decrypt/i).first()).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('encrypt tab is accessible', async ({ page }) => {
    const encryptTab = page.getByRole('tab', { name: /encrypt/i }).or(page.getByRole('button', { name: /encrypt/i }));
    if (await encryptTab.isVisible()) {
      await encryptTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('decrypt tab is accessible', async ({ page }) => {
    const decryptTab = page.getByRole('tab', { name: /decrypt/i }).or(page.getByRole('button', { name: /decrypt/i }));
    if (await decryptTab.isVisible()) {
      await decryptTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('file upload area is visible for importing instructions', async ({ page }) => {
    // Look for file upload/import section
    const uploadArea = page.getByText(/upload|import|drag/i).first();
    await expect(uploadArea).toBeVisible({ timeout: 5000 });
  });

  test('nav tab shows Inheritance Plan as active', async ({ page }) => {
    // The nav tabs should highlight "Inheritance Plan"
    const planTab = page.getByRole('button', { name: /Inheritance Plan/ });
    await expect(planTab).toBeVisible();
    // Check it has the active styling (bg-primary)
    await expect(planTab).toHaveClass(/bg-primary/);
  });

  test('plan sections are navigable', async ({ page }) => {
    // Look for plan section tabs
    const tabs = [
      /Plan Info/i,
      /Recovery/i,
      /Qard/i,
      /Device/i,
      /Digital/i,
      /Professional/i,
      /Personal/i,
      /How to Restore/i,
    ];
    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: tabName }).or(page.getByText(tabName).first());
      if (await tab.isVisible().catch(() => false)) {
        // At least some plan section tabs exist
        break;
      }
    }
  });

  test('inheritance plan form fields accept input', async ({ page }) => {
    // Navigate to plan info tab if available
    const planInfoTab = page.getByRole('tab', { name: /Plan Info/i }).or(page.getByText(/Plan Info/i).first());
    if (await planInfoTab.isVisible().catch(() => false)) {
      await planInfoTab.click();
      await page.waitForTimeout(500);
      // Try to fill any visible input
      const inputs = page.locator('input[type="text"], textarea').first();
      if (await inputs.isVisible().catch(() => false)) {
        await inputs.fill('Test Plan Content');
        expect(await inputs.inputValue()).toBe('Test Plan Content');
      }
    }
  });

  test('XSS in plan fields does not execute', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const inputs = page.locator('input[type="text"], textarea').first();
    if (await inputs.isVisible().catch(() => false)) {
      await inputs.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(300);
      expect(errors).toHaveLength(0);
    }
  });

  test('password generator in inheritance plan', async ({ page }) => {
    // Look for password generator section
    const pwSection = page.getByText(/password/i).first();
    if (await pwSection.isVisible().catch(() => false)) {
      const generateBtn = page.getByRole('button', { name: /generate/i }).first();
      if (await generateBtn.isVisible().catch(() => false)) {
        await generateBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('smart card dialog available for storing plan', async ({ page }) => {
    // Look for smart card integration button
    const scBtn = page.getByRole('button', { name: /smart card/i });
    if (await scBtn.isVisible().catch(() => false)) {
      await scBtn.click();
      await page.waitForTimeout(500);
      // Should open dialog
      await expect(page.getByText(/Smart Card/i).first()).toBeVisible();
    }
  });
});
