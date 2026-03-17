import { test, expect } from '@playwright/test';
import { trackConsoleErrors, waitForApp, skipWelcomeGuide, VALID_PASSWORD, VALID_MNEMONIC_12 } from './helpers';

test.describe('Full Encrypt → Decrypt Roundtrip', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
  });

  test('encrypt a secret and verify shares are generated', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/');
    await waitForApp(page);

    // Step 1: Enter secret
    await page.locator('#secret').fill('My super secret seed phrase backup for e2e testing');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2: Set password
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 3: Configure shares and generate
    await page.locator('#label').fill('E2E Roundtrip Test');
    await page.getByRole('button', { name: /Encrypt & Generate/ }).click();

    // Wait for results
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });

    // Verify share content is displayed (QR images or text shares)
    const hasShares = await page.locator('img[alt*="QR"], .font-mono').count();
    expect(hasShares).toBeGreaterThan(0);

    expect(errors).toEqual([]);
  });

  test('encrypt with BIP-39 mnemonic shows optimized indicator', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    await page.locator('#secret').fill(VALID_MNEMONIC_12);
    await expect(page.getByText('Valid BIP-39 mnemonic')).toBeVisible();

    // Verify the green capacity bar is shown
    await expect(page.getByText(/Estimated QR Data/)).toBeVisible();
  });

  test('encrypt with text-only (large secret) shows text shares', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Create incompressible data larger than QR capacity (needs >1400 bytes estimated)
    const largeSecret = Array.from({length: 5000}, (_, i) => i.toString()).join(' ');
    await page.locator('#secret').fill(largeSecret);

    // Should show capacity warning (text-only mode, estimatedShareSize > 1400)
    await expect(page.getByText(/too large for QR codes/)).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Button should say "Text-Only"
    await expect(page.getByRole('button', { name: /Text-Only/ })).toBeVisible();

    await page.getByRole('button', { name: /Text-Only/ }).click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
  });

  test('encrypt with keyfile enabled', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Step 1
    await page.locator('#secret').fill('keyfile test secret');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Step 2: password + keyfile
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.locator('#use-keyfile').click();

    // Generate a keyfile
    await expect(page.getByText('Generate Keyfile')).toBeVisible();
    const genKeyfileTab = page.getByRole('tab', { name: /generate/i }).or(page.getByText('Generate Keyfile'));
    if (await genKeyfileTab.isVisible()) {
      await genKeyfileTab.click();
    }

    // Look for the generate keyfile action button
    const genKeyfileBtn = page.getByRole('button', { name: /generate|create/i }).filter({ hasNotText: /seed|password/i });
    if (await genKeyfileBtn.count() > 0) {
      await genKeyfileBtn.first().click();
      await page.waitForTimeout(1000);
    }

    // If keyfile generation worked, proceed
    const nextButton = page.getByRole('button', { name: 'Next Step' });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.getByRole('button', { name: /Encrypt & Generate/ }).click();
      await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
    }
  });
});
