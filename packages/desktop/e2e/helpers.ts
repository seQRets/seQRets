import { Page, expect } from '@playwright/test';

/**
 * Track console errors during a test. Returns the mutable errors array.
 * Filter out known benign noise (favicon, Tauri IPC, WebSocket reconnects).
 */
export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        text.includes('favicon') ||
        text.includes('manifest') ||
        text.includes('net::ERR_') ||
        text.includes('WebSocket') ||
        text.includes('ipc://') ||
        text.includes('tauri://') ||
        text.includes('Failed to load resource') ||
        text.includes('404 (Not Found)') ||
        // Tauri-specific noise (IPC not available in browser-only mode)
        text.includes('__TAURI__') ||
        text.includes('plugin:') ||
        text.includes('invoke') ||
        text.includes('window.__TAURI_INTERNALS__') ||
        // BarcodeDetector polyfill
        text.includes('BarcodeDetector') ||
        // Gemini/Bob AI chat errors (no API key in test environment)
        text.includes('Gemini') ||
        text.includes('API key') ||
        text.includes('API Key') ||
        text.includes('getApiKey') ||
        text.includes('AI Error') ||
        text.includes('keychain') ||
        text.includes('keytar') ||
        text.includes('GoogleGenerativeAI') ||
        text.includes('generativelanguage')
      ) return;
      errors.push(text);
    }
  });
  return errors;
}

/**
 * Skip the 3-step welcome guide by setting the localStorage key
 * before the app hydrates.
 */
export async function skipWelcomeGuide(page: Page) {
  await page.goto('/', { waitUntil: 'commit' });
  await page.evaluate(() => {
    localStorage.setItem('seQRets_welcomeGuideShown_v2', 'true');
  });
}

/**
 * Wait for the app to be fully loaded and interactive.
 * Works on all pages — some have "seQRets" h1, others (privacy, terms) have different h1 text.
 */
export async function waitForApp(page: Page) {
  // Wait for any h1 to appear (all pages have one)
  await page.waitForSelector('h1', { timeout: 15000 });
  // Dismiss any stray popover/tooltip
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Navigate to the Create tab on the home page.
 */
export async function goToCreateTab(page: Page) {
  await skipWelcomeGuide(page);
  await page.goto('/');
  await waitForApp(page);
}

/**
 * Navigate to the Restore tab on the home page.
 */
export async function goToRestoreTab(page: Page) {
  await skipWelcomeGuide(page);
  await page.goto('/?tab=restore');
  await waitForApp(page);
  await expect(page.getByText('Restore From Backup')).toBeVisible();
}

/**
 * Enter a secret in step 1 and advance to step 2.
 */
export async function enterSecretAndAdvance(page: Page, secret: string) {
  await page.locator('#secret').fill(secret);
  await page.waitForTimeout(300); // allow seed validation
  const nextBtn = page.getByRole('button', { name: 'Next Step' });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();
  // Wait for step 2 to render (password input visible)
  await expect(page.locator('#password')).toBeVisible({ timeout: 5000 });
}

/**
 * Click the Generate password button (works for both desktop and mobile layouts).
 * Desktop shows "Generate" text, mobile shows only the icon.
 */
export async function clickPasswordGenerate(page: Page) {
  // Use exact: true to avoid matching "Generate New Phrase" (seed generator) or "Hide Generator"
  const desktopBtn = page.getByRole('button', { name: 'Generate', exact: true });
  const mobileBtn = page.locator('button:has(svg.lucide-wand)').or(page.locator('button:has(svg.lucide-wand-sparkles)'));
  if (await desktopBtn.isVisible().catch(() => false)) {
    await desktopBtn.click();
  } else {
    await mobileBtn.first().click();
  }
}

/**
 * Generate a valid password via the Generate button and advance to step 3.
 */
export async function generatePasswordAndAdvance(page: Page) {
  await clickPasswordGenerate(page);
  await page.waitForTimeout(800);

  // Verify the password is valid (green border) — allow extra time for validation
  await expect(page.locator('#password')).toHaveClass(/border-green/, { timeout: 5000 });

  const nextBtn = page.getByRole('button', { name: 'Next Step' });
  await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  await nextBtn.click();
  // Wait for step 3 to render
  await expect(page.getByText('Split into Qards')).toBeVisible({ timeout: 5000 });
}

/**
 * Open the Manual Share Entry dialog and add a share.
 */
export async function addManualShare(page: Page, shareData: string) {
  await page.getByRole('button', { name: /Paste Text/i }).click();
  await page.waitForTimeout(300);
  const textarea = page.getByLabel('Share data');
  await expect(textarea).toBeVisible();
  await textarea.fill(shareData);
  await page.getByRole('button', { name: 'Add Share' }).click();
  await page.waitForTimeout(500); // wait for dialog close + toast
}

/** A password that passes the 24+ char, mixed-class validation. */
export const VALID_PASSWORD = 'TestP@ssw0rd!Secure2024$XYZ';

/** A valid 12-word BIP-39 mnemonic. */
export const VALID_MNEMONIC_12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

/** Desktop app routes. */
export const DESKTOP_ROUTES = ['/', '/about', '/support', '/smartcard', '/inheritance', '/privacy', '/terms'];
