import { test, expect } from '@playwright/test';
import { trackConsoleErrors, waitForApp, goToRestoreTab, VALID_PASSWORD } from './helpers';

/** Helper to add a manual share in restore form. */
async function addManualShare(page: any, shareData: string) {
  await page.getByRole('button', { name: 'Manual Entry' }).click();
  await expect(page.getByText('Manual Share Entry')).toBeVisible();
  await page.getByLabel('Share data').fill(shareData);
  await page.getByRole('button', { name: 'Add Share' }).click();
  // Wait for dialog to close
  await page.waitForTimeout(500);
}

test.describe('Restore Secret Flow', () => {
  test.beforeEach(async ({ page }) => {
    await goToRestoreTab(page);
  });

  test('shows step 1 with add shares UI', async ({ page }) => {
    await expect(page.getByText('Add Your Qards')).toBeVisible();
  });

  test('Next Step disabled with no shares added', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: 'Next Step' });
    await expect(nextButton).toBeDisabled();
  });

  test('manual entry dialog opens and validates format', async ({ page }) => {
    await page.getByRole('button', { name: 'Manual Entry' }).click();
    await expect(page.getByText('Manual Share Entry')).toBeVisible();

    await page.getByLabel('Share data').fill('invalid-share-data');
    await page.getByRole('button', { name: 'Add Share' }).click();

    // Toast appears briefly — check for it with .first()
    await expect(page.getByText('Invalid Share Format').first()).toBeVisible({ timeout: 5000 });
  });

  test('manual entry accepts valid share format', async ({ page }) => {
    await addManualShare(page, 'seQRets|MHoDJz8J69YRmeX993O4PQ==|CAFQ_test_data');
    await expect(page.getByText('Added Shares (1)')).toBeVisible({ timeout: 5000 });
  });

  test('duplicate share shows notification', async ({ page }) => {
    const shareData = 'seQRets|MHoDJz8J69YRmeX993O4PQ==|CAFQ_test_data';

    await addManualShare(page, shareData);
    await expect(page.getByText('Added Shares (1)')).toBeVisible({ timeout: 5000 });

    // Try adding same share again
    await addManualShare(page, shareData);
    await expect(page.getByText(/duplicate/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('remove share button works', async ({ page }) => {
    await addManualShare(page, 'seQRets|test1==|data1');
    await expect(page.getByText('Added Shares (1)')).toBeVisible({ timeout: 5000 });

    // Remove the share (click the X button next to the share)
    await page.getByLabel('Remove share').or(page.locator('li button').first()).click();

    // List should be gone
    await expect(page.getByText('Added Shares')).not.toBeVisible();
  });

  test('step 2 shows credentials form after adding share', async ({ page }) => {
    await addManualShare(page, 'seQRets|test1==|data1');
    await expect(page.getByText('Added Shares (1)')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.getByText('Provide Your Credentials')).toBeVisible();
    await expect(page.locator('#password-restore')).toBeVisible();
  });

  test('keyfile toggle in restore form', async ({ page }) => {
    await addManualShare(page, 'seQRets|test1==|data1');
    await page.getByRole('button', { name: 'Next Step' }).click();

    await page.locator('#use-keyfile-restore').click();
    await expect(page.getByText(/exact same keyfile/)).toBeVisible();
  });

  test('step 3 shows restore button', async ({ page }) => {
    await addManualShare(page, 'seQRets|test1==|data1');
    await page.getByRole('button', { name: 'Next Step' }).click();

    await page.locator('#password-restore').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.getByText('Restore Your Secret')).toBeVisible();
    // Match the restore action button (includes share count), not the nav tab
    await expect(page.getByRole('button', { name: /Restore Secret \(/ })).toBeVisible();
  });

  test('restore with invalid data shows error', async ({ page }) => {
    await addManualShare(page, 'seQRets|invalidbase64==|invaliddata');
    await page.getByRole('button', { name: 'Next Step' }).click();

    await page.locator('#password-restore').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Click the restore action button (includes share count), not the nav tab
    await page.getByRole('button', { name: /Restore Secret \(/ }).click();

    // Should show error (toast or inline alert)
    await expect(
      page.getByText(/failed|error/i).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test('XSS in manual share entry does not execute', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });

    await addManualShare(page, 'seQRets|<script>alert("xss")</script>|data');
    expect(alertFired).toBe(false);
  });
});
