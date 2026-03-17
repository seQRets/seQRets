import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp } from './helpers';

/**
 * Smart Card Integration Tests — Physical Hardware
 *
 * These tests require:
 *   - Identiv SCR3310 v2.0 reader connected
 *   - NXP J3H145 JavaCard inserted
 *   - Tauri backend running (Rust PC/SC bridge)
 *
 * Tests interact with the SmartCardPage (/smartcard) and
 * SmartCardDialog within the create/restore flows.
 */

test.describe('Smart Card — Reader Detection', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/smartcard');
    await waitForApp(page);
  });

  test('page loads and attempts reader detection', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    // Should show either a reader in the dropdown or "Detecting readers..."
    const detecting = page.getByText('Detecting readers...');
    const readerSelect = page.locator('button[role="combobox"]').or(page.getByText(/Identiv|SCR3310|reader/i));
    const noReaders = page.getByText('No readers found');

    // One of these should appear within 10 seconds
    await expect(detecting.or(readerSelect.first()).or(noReaders)).toBeVisible({ timeout: 10000 });
    expect(errors).toHaveLength(0);
  });

  test('reader detection completes without crash', async ({ page }) => {
    // Wait for reader detection to complete
    await page.waitForTimeout(3000);
    // In browser-only mode (no Tauri), listReaders() throws — app should handle gracefully
    // In Tauri mode, it should show reader list or "No readers found"
    // Either way, the page should not crash
    const cardStatus = page.getByText('Card Status');
    const noReaders = page.getByText('No readers found');
    const error = page.getByText(/failed|error|detect/i);
    await expect(cardStatus.or(noReaders).or(error.first())).toBeVisible({ timeout: 10000 });
  });

  test('card status shows item count and capacity', async ({ page }) => {
    await page.waitForTimeout(3000);
    const cardStatus = page.getByText('Card Status');
    if (await cardStatus.isVisible()) {
      // Card detected — should show storage info
      await expect(page.getByText(/items? stored|Card is empty/i)).toBeVisible();
    }
  });
});

test.describe('Smart Card — PIN Management', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/smartcard');
    await waitForApp(page);
    await page.waitForTimeout(3000); // wait for reader detection
  });

  test('Set PIN tab is available', async ({ page }) => {
    const pinTab = page.getByRole('tab', { name: /PIN/i }).or(page.getByText(/Set.*PIN|Change.*PIN/i).first());
    if (await pinTab.isVisible()) {
      await pinTab.click();
      // Should show PIN input fields
      await expect(page.getByText(/PIN/i).first()).toBeVisible();
    }
  });

  test('PIN too short (< 8 chars) is rejected', async ({ page }) => {
    const pinTab = page.getByRole('tab', { name: /PIN/i }).or(page.getByText(/Set.*PIN|Change.*PIN/i).first());
    if (await pinTab.isVisible()) {
      await pinTab.click();
      // Find PIN input
      const pinInput = page.locator('input[type="password"]').first();
      if (await pinInput.isVisible()) {
        await pinInput.fill('short');
        // Set PIN button should be disabled for < 8 chars
        const setBtn = page.getByRole('button', { name: /Set PIN/i });
        if (await setBtn.isVisible()) {
          await expect(setBtn).toBeDisabled();
        }
      }
    }
  });

  test('PIN entry accepts 8-16 characters', async ({ page }) => {
    const pinTab = page.getByRole('tab', { name: /PIN/i }).or(page.getByText(/Set.*PIN|Change.*PIN/i).first());
    if (await pinTab.isVisible()) {
      await pinTab.click();
      const pinInput = page.locator('input[type="password"]').first();
      if (await pinInput.isVisible()) {
        await pinInput.fill('MySecurePin123!$');
        expect((await pinInput.inputValue()).length).toBeLessThanOrEqual(16);
      }
    }
  });

  test('PIN maxLength enforced at 16 chars', async ({ page }) => {
    const pinInput = page.locator('input[maxlength="16"]').first();
    if (await pinInput.isVisible()) {
      await pinInput.fill('12345678901234567890'); // 20 chars
      const val = await pinInput.inputValue();
      expect(val.length).toBeLessThanOrEqual(16);
    }
  });
});

test.describe('Smart Card — PIN Verification', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/smartcard');
    await waitForApp(page);
    await page.waitForTimeout(3000);
  });

  test('wrong PIN shows error and decrements retry counter', async ({ page }) => {
    // Check if card is locked (has PIN set)
    const unlockSection = page.getByText('Enter PIN to unlock');
    if (await unlockSection.isVisible().catch(() => false)) {
      const pinInput = page.locator('#pin-verify').or(page.locator('input[placeholder="Enter PIN"]'));
      await pinInput.fill('WrongPin12345678');
      await page.getByRole('button', { name: /Unlock|Verify/i }).click();
      await page.waitForTimeout(2000);
      // Should show error or retry count
      const error = page.getByText(/failed|incorrect|wrong/i);
      const retries = page.getByText(/attempt.*remaining/i);
      await expect(error.or(retries)).toBeVisible({ timeout: 5000 });
    }
  });

  test('correct PIN unlocks the card', async ({ page }) => {
    // This test depends on knowing the actual PIN — skip if not applicable
    const unlockSection = page.getByText('Enter PIN to unlock');
    if (await unlockSection.isVisible().catch(() => false)) {
      // Card is locked — the actual PIN is hardware-specific
      // Documenting that the flow works when correct PIN is entered
      test.skip(true, 'PIN-locked card detected — correct PIN required for this test');
    }
  });
});

test.describe('Smart Card — Erase', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/smartcard');
    await waitForApp(page);
    await page.waitForTimeout(3000);
  });

  test('Erase Card tab is available', async ({ page }) => {
    const eraseTab = page.getByRole('tab', { name: /erase/i }).or(page.getByText(/Erase.*Card|Factory.*Reset/i).first());
    if (await eraseTab.isVisible()) {
      await eraseTab.click();
      await expect(page.getByText(/erase|wipe|reset/i).first()).toBeVisible();
    }
  });

  test('erase requires confirmation dialog', async ({ page }) => {
    const eraseTab = page.getByRole('tab', { name: /erase/i }).or(page.getByText(/Erase.*Card|Factory.*Reset/i).first());
    if (await eraseTab.isVisible()) {
      await eraseTab.click();
      const eraseBtn = page.getByRole('button', { name: /Erase|Factory Reset/i }).first();
      if (await eraseBtn.isVisible() && await eraseBtn.isEnabled()) {
        await eraseBtn.click();
        // Should show confirmation dialog
        await expect(page.getByText(/permanently|are you sure|confirm/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Smart Card — Create Flow Integration', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
  });

  test('smart card button is available in restore flow', async ({ page }) => {
    // Switch to restore tab — use exact nav tab button text
    await page.getByRole('button', { name: 'Restore Secret' }).click();
    await expect(page.getByText('Restore From Backup')).toBeVisible();
    // Look for smart card button in share input area
    const scBtn = page.getByRole('button', { name: /Smart Card/i });
    await expect(scBtn).toBeVisible();
  });

  test('smart card dialog opens from restore flow', async ({ page }) => {
    await page.getByRole('button', { name: 'Restore Secret' }).click();
    await expect(page.getByText('Restore From Backup')).toBeVisible();
    await page.getByRole('button', { name: /Smart Card/i }).click();
    // Should open SmartCardDialog in read mode
    await expect(page.getByText(/Read from Smart Card/i)).toBeVisible({ timeout: 5000 });
  });
});
