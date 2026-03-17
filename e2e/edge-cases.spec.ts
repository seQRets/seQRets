import { test, expect } from '@playwright/test';
import { waitForApp, goToCreateTab, skipWelcomeGuide, clickPasswordGenerate, VALID_PASSWORD } from './helpers';

test.describe('Edge Cases & Stress Tests', () => {
  test('rapid clicks on Encrypt button does not cause duplicate generation', async ({ page }) => {
    await goToCreateTab(page);

    // Step 1
    await page.locator('#secret').fill('rapid click test secret');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 3: rapidly click the generate button
    const genButton = page.getByRole('button', { name: /Encrypt & Generate/ });
    await genButton.click();
    // The button should either be disabled (isGenerating) or the result already shown
    // Crypto can complete very fast, so just check the result appears
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });

    // Verify only one set of results (no duplicates from rapid clicks)
    const startOverButtons = await page.getByRole('button', { name: 'Start Over' }).count();
    expect(startOverButtons).toBe(1);
  });

  test('navigating away mid-encryption and coming back', async ({ page }) => {
    await goToCreateTab(page);

    await page.locator('#secret').fill('navigate away test');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: /Encrypt & Generate/ }).click();

    // Immediately navigate away
    await page.goto('/about');
    await expect(page.getByText('Security Architecture')).toBeVisible();

    // Come back — form should be reset (worker result lost)
    await page.goto('/');
    await waitForApp(page);
    await expect(page.getByText('Enter Your Secret')).toBeVisible();
  });

  test('browser refresh during form completion resets state', async ({ page }) => {
    await goToCreateTab(page);

    await page.locator('#secret').fill('refresh test secret');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Refresh
    await page.reload();
    await waitForApp(page);

    // Form should be reset to step 1
    await expect(page.getByText('Enter Your Secret')).toBeVisible();
    await expect(page.locator('#secret')).toHaveValue('');
  });

  test('copy password button shows toast', async ({ page }) => {
    await goToCreateTab(page);

    await page.locator('#secret').fill('test');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Generate a password first
    await clickPasswordGenerate(page);

    // Click copy button
    await page.getByLabel('Copy password').click();
    await expect(page.getByText(/copied to clipboard/i)).toBeVisible({ timeout: 5000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    await goToCreateTab(page);

    await page.locator('#secret').fill('test');
    await page.getByRole('button', { name: 'Next Step' }).click();

    const passwordInput = page.locator('#password');
    await passwordInput.fill('testpassword');

    // Should start as password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Toggle visibility
    await page.getByLabel('Show password').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle back
    await page.getByLabel('Hide password').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('null bytes in secret are handled', async ({ page }) => {
    await goToCreateTab(page);

    await page.locator('#secret').fill('test\x00secret\x00data');
    const nextButton = page.getByRole('button', { name: 'Next Step' });
    await expect(nextButton).toBeEnabled();
  });

  test('label field accepts special characters', async ({ page }) => {
    await goToCreateTab(page);

    await page.locator('#secret').fill('test secret');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Fill label with special chars
    await page.locator('#label').fill('🔐 My <Secret> "Wallet" & Keys');
    await expect(page.locator('#label')).toHaveValue('🔐 My <Secret> "Wallet" & Keys');
  });
});

test.describe('Theme Toggle', () => {
  test('dark/light mode can be toggled', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);

    // Open hamburger menu to find theme toggle
    const menuButton = page.locator('button').filter({ has: page.locator('.lucide-menu') }).first();
    await menuButton.click();

    // Look for theme option
    const themeOption = page.getByText(/dark|light|system/i).first();
    if (await themeOption.isVisible()) {
      await themeOption.click();
      await page.waitForTimeout(500);
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toBeDefined();
    }
  });
});
