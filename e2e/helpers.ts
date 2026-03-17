import { Page, expect } from '@playwright/test';

/** Collect console errors during a test. Call at test start, check at end. */
export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign errors
      if (
        text.includes('favicon') ||
        text.includes('service-worker') ||
        text.includes('sw.js') ||
        text.includes('Failed to load resource') && text.includes('.webp') ||
        text.includes('net::ERR_') ||
        text.includes('404 (Not Found)') && (text.includes('favicon') || text.includes('manifest'))
      ) return;
      errors.push(text);
    }
  });
  return errors;
}

/** Set localStorage to skip the Welcome Guide dialog. Must be called before goto(). */
export async function skipWelcomeGuide(page: Page) {
  // Navigate to the origin first to set localStorage in the correct domain
  await page.goto('/', { waitUntil: 'commit' });
  await page.evaluate(() => {
    localStorage.setItem('seQRets_welcomeGuideShown_v2', 'true');
  });
}

/** Wait for the app to finish hydrating. */
export async function waitForApp(page: Page) {
  // Wait for the main element to be visible (skeleton replaced by real content)
  await page.waitForSelector('h1:has-text("seQRets")', { timeout: 15000 });
  // Dismiss any service worker toast by pressing Escape
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

/** Navigate to create tab on home page. */
export async function goToCreateTab(page: Page) {
  await skipWelcomeGuide(page);
  await page.goto('/');
  await waitForApp(page);
}

/** Navigate to restore tab on home page. */
export async function goToRestoreTab(page: Page) {
  await skipWelcomeGuide(page);
  await page.goto('/?tab=restore');
  await waitForApp(page);
  // Verify restore form is showing
  await expect(page.getByText('Restore From Backup')).toBeVisible();
}

/** Type a secret and advance to step 2. */
export async function enterSecretAndAdvance(page: Page, secret: string) {
  const textarea = page.locator('#secret');
  await textarea.fill(secret);
  await page.getByRole('button', { name: 'Next Step' }).click();
}

/** Click the password Generate button (works on all viewports).
 *  On desktop it has text "Generate"; on mobile it's icon-only (no accessible name).
 *  We target it as the button right after the Copy password button. */
export async function clickPasswordGenerate(page: Page) {
  // Try desktop selector first, fall back to sibling of Copy password button
  const desktopBtn = page.getByRole('button', { name: 'Generate', exact: true });
  if (await desktopBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await desktopBtn.click();
  } else {
    // Mobile: icon-only button after Copy password
    await page.locator('button[aria-label="Copy password"] + button').click();
  }
}

/** Generate a password and advance to step 3. */
export async function generatePasswordAndAdvance(page: Page) {
  await clickPasswordGenerate(page);
  // Wait for password field to be filled (green border)
  await expect(page.locator('#password')).not.toHaveValue('');
  // Advance to step 3
  await page.getByRole('button', { name: 'Next Step' }).click();
}

/** Fill password manually. */
export async function fillPassword(page: Page, password: string) {
  await page.locator('#password').fill(password);
}

/** A valid strong password for testing. */
export const VALID_PASSWORD = 'TestP@ssw0rd!Secure2024$XYZ';

/** A valid 12-word BIP-39 mnemonic for testing. */
export const VALID_MNEMONIC_12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
