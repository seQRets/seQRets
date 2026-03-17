import { test, expect } from '@playwright/test';
import { trackConsoleErrors, goToRestoreTab, addManualShare, VALID_PASSWORD } from './helpers';

test.describe('Restore Flow — Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await goToRestoreTab(page);
  });

  test('step 1 shows share input options', async ({ page }) => {
    await expect(page.getByText('Add Your Qards')).toBeVisible();
    // Should have manual entry button
    await expect(page.getByRole('button', { name: /Paste Text/i })).toBeVisible();
  });

  test('manual entry dialog opens and closes', async ({ page }) => {
    await page.getByRole('button', { name: /Paste Text/i }).click();
    await expect(page.getByText('Manual Share Entry')).toBeVisible();
    await expect(page.getByLabel('Share data')).toBeVisible();
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('invalid share format shows error toast', async ({ page }) => {
    await page.getByRole('button', { name: /Paste Text/i }).click();
    await page.waitForTimeout(300);
    await page.getByLabel('Share data').fill('not a valid share');
    await page.getByRole('button', { name: 'Add Share' }).click();
    await expect(page.getByText('Invalid Share Format').first()).toBeVisible({ timeout: 5000 });
  });

  test('valid share format is accepted', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await expect(page.getByText('Added Shares')).toBeVisible();
    await expect(page.getByText('Manual Entry 1').first()).toBeVisible();
  });

  test('duplicate share detection', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await addManualShare(page, fakeShare);
    await expect(page.getByText('Duplicate Share').first()).toBeVisible({ timeout: 5000 });
  });

  test('remove share button works', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await expect(page.getByText('Manual Entry 1').first()).toBeVisible();
    await page.getByRole('button', { name: 'Remove share' }).click();
    // After removing, the Next Step button should be disabled (no shares left)
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeDisabled({ timeout: 5000 });
    // "Added Shares" section should disappear
    await expect(page.getByText('Added Shares')).not.toBeVisible({ timeout: 5000 });
  });

  test('Next Step enabled after adding a share', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    const nextBtn = page.getByRole('button', { name: 'Next Step' });
    await expect(nextBtn).toBeEnabled();
  });

  test('step 2 shows password and keyfile fields', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.locator('#password-restore')).toBeVisible();
    await expect(page.getByText('Was a Keyfile used?')).toBeVisible();
  });

  test('keyfile toggle in restore shows upload area', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#use-keyfile-restore').click();
    await expect(page.getByText(/exact same keyfile/)).toBeVisible();
  });

  test('step 3 shows restore button with share count', async ({ page }) => {
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password-restore').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByRole('button', { name: /Restore Secret \(1 shares?\)/ })).toBeVisible();
  });

  test('restore with invalid data shows error', async ({ page }) => {
    test.skip(!process.env.TAURI, 'Requires Tauri IPC — run with tauri:dev');
    const fakeShare = 'seQRets|dGVzdHNhbHQ=|dGVzdGRhdGE=';
    await addManualShare(page, fakeShare);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password-restore').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: /Restore Secret \(/ }).click();
    // Should fail — invalid encrypted data
    await expect(page.getByText(/Failed|Error|corrupted/i).first()).toBeVisible({ timeout: 30000 });
  });

  test('XSS payload in manual share entry is sanitized', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.getByRole('button', { name: /Paste Text/i }).click();
    await page.waitForTimeout(300);
    await page.getByLabel('Share data').fill('<script>alert("xss")</script>');
    await page.getByRole('button', { name: 'Add Share' }).click();
    // Should show invalid format, not execute script
    await expect(page.getByText('Invalid Share Format').first()).toBeVisible({ timeout: 5000 });
    expect(errors).toHaveLength(0);
  });
});
