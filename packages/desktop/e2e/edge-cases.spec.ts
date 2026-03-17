import { test, expect } from '@playwright/test';
import {
  trackConsoleErrors,
  goToCreateTab,
  goToRestoreTab,
  enterSecretAndAdvance,
  generatePasswordAndAdvance,
  clickPasswordGenerate,
  skipWelcomeGuide,
  waitForApp,
  VALID_PASSWORD,
} from './helpers';

test.describe('Edge Cases & Adversarial — Desktop', () => {
  // ── Rapid Clicks ──────────────────────────────────────────────────────

  test('rapid clicks on encrypt button does not double-submit', async ({ page }) => {
    test.skip(!process.env.TAURI, 'Requires Tauri IPC — run with tauri:dev');
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'rapid click test');
    await generatePasswordAndAdvance(page);
    const encryptBtn = page.getByRole('button', { name: /Encrypt & Generate/ });
    // Click rapidly
    await encryptBtn.click();
    await encryptBtn.click().catch(() => {});
    await encryptBtn.click().catch(() => {});
    // Button should show spinner/disabled state
    await page.waitForTimeout(1000);
    // Should eventually resolve to a single result
    await expect(page.getByText('Your Encrypted Qards').or(page.getByText('Generating'))).toBeVisible({ timeout: 30000 });
  });

  // ── Navigate Away Mid-Encryption ──────────────────────────────────────

  test('navigate away mid-encryption does not crash', async ({ page }) => {
    test.skip(!process.env.TAURI, 'Requires Tauri IPC — run with tauri:dev');
    const errors = trackConsoleErrors(page);
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'navigate away test');
    await generatePasswordAndAdvance(page);
    const encryptBtn = page.getByRole('button', { name: /Encrypt & Generate/ });
    await encryptBtn.click();
    // Navigate away immediately (while Argon2id is running)
    await page.goto('/about');
    await waitForApp(page);
    // Should not crash
    await expect(page.getByText('Security Architecture')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  // ── Browser Refresh Reset ─────────────────────────────────────────────

  test('browser refresh resets form to step 1', async ({ page }) => {
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'refresh test');
    // Now at step 2
    await expect(page.locator('#password')).toBeVisible();
    // Refresh
    await page.reload();
    await waitForApp(page);
    // Should be back at step 1
    await expect(page.locator('#secret')).toBeVisible();
    await expect(page.locator('#secret')).toHaveValue('');
  });

  // ── Password Visibility Toggle ────────────────────────────────────────

  test('password visibility toggle works', async ({ page }) => {
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'visibility test');
    await page.locator('#password').fill(VALID_PASSWORD);
    // Default: password is hidden
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    // Click show
    await page.getByLabel('Show password').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    // Click hide
    await page.getByLabel('Hide password').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });

  // ── Copy Password ─────────────────────────────────────────────────────

  test('copy password button triggers toast', async ({ page }) => {
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'copy test');
    // Generate password first so the copy button is enabled
    await clickPasswordGenerate(page);
    await page.waitForTimeout(800);
    // Verify password was generated (green border)
    await expect(page.locator('#password')).toHaveClass(/border-green/, { timeout: 5000 });
    // Now click copy
    const copyBtn = page.getByLabel('Copy password');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText('Copied to clipboard!').first()).toBeVisible({ timeout: 5000 });
  });

  // ── Null Bytes ────────────────────────────────────────────────────────

  test('null bytes in secret do not crash', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await goToCreateTab(page);
    await page.locator('#secret').fill('before\x00after');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  // ── Label Special Characters ──────────────────────────────────────────

  test('special characters in label field', async ({ page }) => {
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'label test');
    await generatePasswordAndAdvance(page);
    await page.locator('#label').fill('My <b>Label</b> & "Special" \'Chars\' 日本語');
    const val = await page.locator('#label').inputValue();
    expect(val).toContain('<b>Label</b>');
  });

  // ── Theme Toggle ──────────────────────────────────────────────────────

  test('theme toggle does not crash', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
    // Toggle theme via localStorage
    await page.evaluate(() => {
      const current = localStorage.getItem('theme');
      localStorage.setItem('theme', current === 'dark' ? 'light' : 'dark');
    });
    await page.reload();
    await waitForApp(page);
    expect(errors).toHaveLength(0);
  });

  // ── XSS Payloads in All Inputs ────────────────────────────────────────

  test('XSS in secret textarea', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await goToCreateTab(page);
    await page.locator('#secret').fill('"><img onerror=alert(1) src=x>');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('XSS in password field', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'xss test');
    await page.locator('#password').fill('<script>alert("xss")</script>Aa1!LongEnoughPassword123');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('XSS in label field', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await goToCreateTab(page);
    await enterSecretAndAdvance(page, 'xss label test');
    await generatePasswordAndAdvance(page);
    await page.locator('#label').fill('<img src=x onerror=alert(1)>');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('XSS in restore password field', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await goToRestoreTab(page);
    // Need to add a share first to advance to step 2
    await page.getByRole('button', { name: /Paste Text/i }).click();
    await page.waitForTimeout(300);
    await page.getByLabel('Share data').fill('seQRets|dGVzdA==|dGVzdA==');
    await page.getByRole('button', { name: 'Add Share' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#password-restore').fill('<script>alert(1)</script>');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  // ── LocalStorage ──────────────────────────────────────────────────────

  test('app works with empty localStorage', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    // Welcome guide will appear — that's expected
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('corrupted localStorage data does not crash', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.setItem('seQRets_welcomeGuideShown_v2', '{corrupted json');
      localStorage.setItem('theme', '<<<invalid>>>');
      localStorage.setItem('bob-chat-history', 'not-json');
    });
    await page.goto('/');
    await page.waitForTimeout(3000);
    // App should still render — look for any h1 (welcome guide or main app)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    expect(errors).toHaveLength(0);
  });

  test('oversized localStorage value does not crash', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
    await page.evaluate(() => {
      try {
        localStorage.setItem('oversized_test', 'X'.repeat(5_000_000));
      } catch { /* expected — quota exceeded */ }
    });
    await page.reload();
    await waitForApp(page);
    expect(errors).toHaveLength(0);
  });

  test('theme persistence across reload', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
    // Set dark theme
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();
    await waitForApp(page);
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });

  // ── Rapid Navigation ──────────────────────────────────────────────────

  test('rapid navigation between routes does not crash', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await skipWelcomeGuide(page);
    const routes = ['/', '/about', '/support', '/inheritance', '/smartcard', '/privacy', '/terms', '/'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(200);
    }
    await waitForApp(page);
    expect(errors).toHaveLength(0);
  });
});
