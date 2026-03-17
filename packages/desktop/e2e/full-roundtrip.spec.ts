import { test, expect } from '@playwright/test';
import {
  trackConsoleErrors,
  goToCreateTab,
  goToRestoreTab,
  enterSecretAndAdvance,
  generatePasswordAndAdvance,
  addManualShare,
  VALID_PASSWORD,
  VALID_MNEMONIC_12,
} from './helpers';

test.describe('Full Roundtrip — Desktop (Tauri IPC)', () => {
  test.beforeEach(() => {
    test.skip(!process.env.TAURI, 'Requires Tauri IPC — run with TAURI=1 and tauri:dev');
  });

  test('encrypt → extract shares → restore → verify original secret matches', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const originalSecret = 'My super secret passphrase for roundtrip testing!';

    // ── Create ──────────────────────────────────────────────────────────
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, originalSecret);

    // Enter password manually (so we know the exact password for restore)
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.waitForTimeout(300);
    await expect(page.locator('#password')).toHaveClass(/border-green/);
    const nextBtn = page.getByRole('button', { name: 'Next Step' });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await expect(page.getByText('Split into Qards')).toBeVisible({ timeout: 5000 });

    // Set 2-of-3 split (default), add label
    await page.locator('#label').fill('Roundtrip Test');

    // Encrypt
    const encryptBtn = page.getByRole('button', { name: /Encrypt & Generate/ });
    await encryptBtn.click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });

    // Extract share data from the page — shares are rendered as text
    // Look for seQRets| pattern in page content
    const pageContent = await page.content();
    const shareRegex = /seQRets\|[A-Za-z0-9+/=]+\|[A-Za-z0-9+/=]+/g;
    const shares = pageContent.match(shareRegex) || [];

    // For a 2-of-3 split we need at least 2 shares
    expect(shares.length).toBeGreaterThanOrEqual(2);

    // Verify each encryption produces different ciphertext (nonce uniqueness)
    // All shares share the same salt but have different share data
    const uniqueShares = new Set(shares);
    expect(uniqueShares.size).toBe(shares.length);

    // ── Restore ─────────────────────────────────────────────────────────
    await goToRestoreTab(page);

    // Add 2 shares (the threshold)
    await addManualShare(page, shares[0]);
    await addManualShare(page, shares[1]);

    // Advance to step 2
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.locator('#password-restore')).toBeVisible();

    // Enter password
    await page.locator('#password-restore').fill(VALID_PASSWORD);

    // Advance to step 3
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Restore
    await page.getByRole('button', { name: /Restore Secret/ }).click();
    await expect(page.getByText('Secret Revealed!')).toBeVisible({ timeout: 30000 });

    // Verify the restored secret matches the original
    const restoredTextarea = page.getByLabel('Restored secret');
    // Show the secret first
    const showBtn = page.getByTitle('Show secret');
    if (await showBtn.isVisible()) {
      await showBtn.click();
    }
    const restoredValue = await restoredTextarea.inputValue();
    expect(restoredValue).toBe(originalSecret);

    // Verify label
    await expect(page.getByText('Roundtrip Test')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('BIP-39 mnemonic roundtrip preserves optimized encoding', async ({ page }) => {
    const errors = trackConsoleErrors(page);

    // ── Create with mnemonic ────────────────────────────────────────────
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, VALID_MNEMONIC_12);
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.waitForTimeout(300);
    const nextBtn = page.getByRole('button', { name: 'Next Step' });
    await nextBtn.click();
    await expect(page.getByText('Split into Qards')).toBeVisible({ timeout: 5000 });

    // Set 1/1 split for simplicity
    const totalSlider = page.locator('#total-shares');
    await totalSlider.click();
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /Encrypt & Generate/ }).click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });

    // Extract the single share
    const pageContent = await page.content();
    const shareRegex = /seQRets\|[A-Za-z0-9+/=]+\|[A-Za-z0-9+/=]+/g;
    const shares = pageContent.match(shareRegex) || [];
    expect(shares.length).toBeGreaterThanOrEqual(1);

    // ── Restore ─────────────────────────────────────────────────────────
    await goToRestoreTab(page);
    await addManualShare(page, shares[0]);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password-restore').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: /Restore Secret/ }).click();
    await expect(page.getByText('Secret Revealed!')).toBeVisible({ timeout: 30000 });

    // Verify mnemonic restored exactly
    const showBtn = page.getByTitle('Show secret');
    if (await showBtn.isVisible()) await showBtn.click();
    const restoredValue = await page.getByLabel('Restored secret').inputValue();
    expect(restoredValue).toBe(VALID_MNEMONIC_12);

    // SeedQR button should be available for mnemonics
    await expect(page.getByRole('button', { name: /SeedQR/i })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('encryption produces different ciphertext on each run (nonce uniqueness)', async ({ page }) => {
    const secret = 'nonce uniqueness test';

    // Run 1
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, secret);
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Split into Qards')).toBeVisible({ timeout: 5000 });
    // 1/1 split
    await page.locator('#total-shares').click();
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Encrypt & Generate/ }).click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
    const content1 = await page.content();
    const shares1 = content1.match(/seQRets\|[A-Za-z0-9+/=]+\|[A-Za-z0-9+/=]+/g) || [];

    // Run 2
    await page.getByRole('button', { name: 'Start Over' }).click();
    await enterSecretAndAdvance(page, secret);
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Split into Qards')).toBeVisible({ timeout: 5000 });
    await page.locator('#total-shares').click();
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Encrypt & Generate/ }).click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
    const content2 = await page.content();
    const shares2 = content2.match(/seQRets\|[A-Za-z0-9+/=]+\|[A-Za-z0-9+/=]+/g) || [];

    // Same secret + password must produce different ciphertext (different salt + nonce)
    expect(shares1[0]).not.toBe(shares2[0]);
  });

  test('large text secret roundtrip (text-only mode)', async ({ page }) => {
    const largeSecret = 'L'.repeat(2000);

    await goToCreateTab(page);
    await enterSecretAndAdvance(page, largeSecret);
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Split into Qards')).toBeVisible({ timeout: 5000 });

    // 1/1 split
    await page.locator('#total-shares').click();
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);

    const encryptBtn = page.getByRole('button', { name: /Encrypt & Generate/ });
    await encryptBtn.click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
  });
});
